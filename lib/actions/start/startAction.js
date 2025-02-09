"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _isPlainObject2 = _interopRequireDefault(require("lodash/isPlainObject"));
var _get2 = _interopRequireDefault(require("lodash/get"));
var _path = _interopRequireDefault(require("path"));
var _chalk = _interopRequireDefault(require("chalk"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _es6Promisify = require("es6-promisify");
var _server = require("@sanity/server");
var _getConfig = _interopRequireDefault(require("@sanity/util/lib/getConfig"));
var _chooseDatasetPrompt = _interopRequireDefault(require("../dataset/chooseDatasetPrompt"));
var _reinitializePluginConfigs = require("../../actions/config/reinitializePluginConfigs");
var _checkStudioDependencyVersions = _interopRequireDefault(require("../../util/checkStudioDependencyVersions"));
var _checkRequiredDependencies = require("../../util/checkRequiredDependencies");
var _debug = _interopRequireDefault(require("../../debug"));
var _formatMessage = require("./formatMessage");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = async (args, context) => {
  const flags = args.extOptions;
  const {
    output,
    workDir
  } = context;
  await ensureProjectConfig(context);
  const sanityConfig = (0, _getConfig.default)(workDir);
  const config = sanityConfig.get('server');
  const {
    port,
    hostname
  } = config;
  const httpHost = flags.host === 'all' ? '0.0.0.0' : flags.host || hostname;
  const httpPort = flags.port || port;
  const serverOptions = {
    staticPath: resolveStaticPath(workDir, config),
    basePath: workDir,
    httpHost,
    httpPort,
    context,
    project: sanityConfig.get('project'),
    lang: sanityConfig.get('lang')
  };
  await (0, _checkStudioDependencyVersions.default)(workDir);

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await (0, _checkRequiredDependencies.checkRequiredDependencies)(context)).didInstall) {
    return;
  }
  let compileSpinner;
  const configSpinner = output.spinner('Checking configuration files...');
  await (0, _reinitializePluginConfigs.tryInitializePluginConfigs)({
    workDir,
    output,
    env: 'development'
  });
  configSpinner.succeed();
  const server = (0, _server.getDevServer)(serverOptions);
  const compiler = server.locals.compiler;

  // "invalid" doesn't mean the bundle is invalid, but that it is *invalidated*,
  // in other words, it's recompiling
  compiler.plugin('invalid', () => {
    output.clear();
    resetSpinner();
  });

  // Start the server and try to create more user-friendly errors if we encounter issues
  try {
    await (0, _es6Promisify.promisify)(server.listen.bind(server))(httpPort, httpHost);
  } catch (err) {
    gracefulDeath(httpHost, config, err);
  }

  // Hold off on showing the spinner until compilation has started
  compiler.plugin('compile', () => resetSpinner());

  // "done" event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors, you will get this event.

  compiler.plugin('done', stats => {
    if (compileSpinner) {
      compileSpinner.succeed();
    }
    const hasErrors = stats.hasErrors();
    const hasWarnings = stats.hasWarnings();
    if (!hasErrors && !hasWarnings) {
      output.print(_chalk.default.green(`Content Studio successfully compiled! Go to http://${httpHost}:${httpPort}`) // eslint-disable-line max-len
      );

      return;
    }
    const {
      errors,
      warnings
    } = stats.toJson({}, true);
    if (hasErrors) {
      printErrors(output, errors);
      return; // If errors exist, ignore warnings.
    }

    if (hasWarnings) {
      printWarnings(output, warnings);
    }
    output.print(_chalk.default.green(`Content Studio listening on http://${httpHost}:${httpPort}`));
  });
  function resetSpinner() {
    if (compileSpinner) {
      compileSpinner.stop();
    }
    compileSpinner = output.spinner('Compiling...').start();
  }
};
exports.default = _default;
async function ensureProjectConfig(context) {
  const {
    workDir,
    output
  } = context;
  const manifestPath = _path.default.join(workDir, 'sanity.json');
  const projectManifest = await _fsExtra.default.readJson(manifestPath);
  const apiConfig = projectManifest.api || {};
  if (!(0, _isPlainObject2.default)(apiConfig)) {
    throw new Error('Invalid `api` property in `sanity.json` - should be an object');
  }

  // The API client wrapper extracts information from environment variables,
  // which means it could potentially hold any missing project ID / dataset
  let {
    projectId,
    dataset
  } = context.apiClient({
    requireProject: false,
    requireUser: false
  }).config();

  // The client wrapper returns `~dummy-placeholder-dataset-` in the case where
  // no dataset is configured, to be able to do non-dataset requests without
  // having the client complain. We don't want to use this as an _actual_ value.
  dataset = dataset === '~dummy-placeholder-dataset-' ? undefined : dataset;

  // Let the user know why these values are being used
  if (projectId && projectId !== apiConfig.projectId) {
    output.print(`Using project ID from environment config (${projectId})`);
  }
  if (dataset && dataset !== apiConfig.dataset) {
    output.print(`Using dataset from environment config (${dataset})`);
  }

  // If we're still missing information, prompt the user to provide them
  const configMissing = !projectId || !dataset;
  if (!configMissing) {
    validateAllowedDataset(dataset);
    return;
  }
  output.print('Project configuration required before starting studio');
  output.print('');
  let displayName = (0, _get2.default)(projectManifest, 'project.displayName');
  if (!projectId) {
    const selected = await getOrCreateProject(context);
    projectId = selected.projectId;
    displayName = selected.displayName;
  }
  if (!dataset) {
    const client = context.apiClient({
      requireUser: true,
      requireProject: false
    }).config({
      projectId,
      useProjectHostname: true
    });
    const apiClient = () => client;
    const projectContext = {
      ...context,
      apiClient
    };
    dataset = await (0, _chooseDatasetPrompt.default)(projectContext, {
      allowCreation: true
    });
  }

  // Rewrite project manifest (sanity.json)
  const projectInfo = projectManifest.project || {};
  const newProps = {
    root: true,
    api: {
      ...apiConfig,
      projectId,
      dataset
    },
    project: {
      ...projectInfo,
      // Keep original name if present
      name: projectInfo.name || displayName
    }
  };
  await _fsExtra.default.outputJSON(manifestPath, {
    // We're listing `newProps` twice to ensure root, api and project keys
    // are at top to follow sanity.json key order convention
    ...newProps,
    ...projectManifest,
    ...newProps
  }, {
    spaces: 2
  });
  output.print(`Project ID + dataset written to "${manifestPath}"`);
}
function resolveStaticPath(rootDir, config) {
  const {
    staticPath
  } = config;
  return _path.default.isAbsolute(staticPath) ? staticPath : _path.default.resolve(_path.default.join(rootDir, staticPath));
}
function gracefulDeath(httpHost, config, err) {
  if (err.code === 'EADDRINUSE') {
    throw new Error('Port number is already in use, configure `server.port` in `sanity.json`');
  }
  if (err.code === 'EACCES') {
    const help = config.port < 1024 ? 'port numbers below 1024 requires root privileges' : `do you have access to listen to the given host (${httpHost})?`;
    throw new Error(`The Content Studio server does not have access to listen to given port - ${help}`); // eslint-disable-line max-len
  }

  throw err;
}
function printErrors(output, errors) {
  output.print(_chalk.default.red('Failed to compile.'));
  output.print('');
  const formattedErrors = (errors.some(_formatMessage.isLikelyASyntaxError) ? errors.filter(_formatMessage.isLikelyASyntaxError) : errors).map(message => `Error in ${(0, _formatMessage.formatMessage)(message)}`);
  formattedErrors.forEach(message => {
    output.print(message);
    output.print('');
  });
}
function printWarnings(output, warnings) {
  output.print(_chalk.default.yellow('Compiled with warnings.'));
  output.print();
  warnings.map(message => `Warning in ${(0, _formatMessage.formatMessage)(message)}`).forEach(message => {
    output.print(message);
    output.print();
  });
}
async function getOrCreateProject(context) {
  const {
    prompt,
    apiClient
  } = context;
  let projects;
  try {
    projects = await apiClient({
      requireProject: false
    }).projects.list();
  } catch (err) {
    throw new Error(`Failed to communicate with the Sanity API:\n${err.message}`);
  }
  if (projects.length === 0) {
    (0, _debug.default)('No projects found for user, prompting for name');
    const projectName = await prompt.single({
      message: 'Project name'
    });
    return createProject(apiClient, {
      displayName: projectName
    });
  }
  (0, _debug.default)(`User has ${projects.length} project(s) already, showing list of choices`);
  const projectChoices = projects.map(project => ({
    value: project.id,
    name: `${project.displayName} [${project.id}]`
  }));
  const selected = await prompt.single({
    message: 'Select project to use',
    type: 'list',
    choices: [{
      value: 'new',
      name: 'Create new project'
    }, new prompt.Separator(), ...projectChoices]
  });
  if (selected === 'new') {
    (0, _debug.default)('User wants to create a new project, prompting for name');
    return createProject(apiClient, {
      displayName: await prompt.single({
        message: 'Informal name for your project'
      })
    });
  }
  (0, _debug.default)(`Returning selected project (${selected})`);
  return {
    projectId: selected,
    displayName: projects.find(proj => proj.id === selected).displayName
  };
}
function createProject(apiClient, options) {
  return apiClient({
    requireUser: true,
    requireProject: false
  }).request({
    method: 'POST',
    uri: '/projects',
    body: options
  }).then(response => ({
    projectId: response.projectId || response.id,
    displayName: options.displayName || ''
  }));
}
function validateAllowedDataset(datasetName) {
  if (datasetName.startsWith('~')) {
    throw new Error('Dataset aliases cannot be used in a studio context');
  }
}