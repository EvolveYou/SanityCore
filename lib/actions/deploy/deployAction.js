"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _zlib = _interopRequireDefault(require("zlib"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _tarFs = _interopRequireDefault(require("tar-fs"));
var _lazyRequire = _interopRequireDefault(require("@sanity/util/lib/lazyRequire"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = async (args, context) => {
  const {
    apiClient,
    workDir,
    chalk,
    output,
    prompt
  } = context;
  const flags = Object.assign({
    build: true
  }, args.extOptions);
  const sourceDir = _path.default.resolve(process.cwd(), args.argsWithoutOptions[0] || _path.default.join(workDir, 'dist'));
  if (args.argsWithoutOptions[0] === 'graphql') {
    throw new Error('Did you mean `sanity graphql deploy`?');
  } else if (args.argsWithoutOptions[0]) {
    let relativeOutput = _path.default.relative(process.cwd(), sourceDir);
    if (relativeOutput[0] !== '.') {
      relativeOutput = `./${relativeOutput}`;
    }
    const isEmpty = await dirIsEmptyOrNonExistent(sourceDir);
    const shouldProceed = isEmpty || (await prompt.single({
      type: 'confirm',
      message: `"${relativeOutput}" is not empty, do you want to proceed?`,
      default: false
    }));
    if (!shouldProceed) {
      output.print('Cancelled.');
      return;
    }
    output.print(`Building to ${relativeOutput}\n`);
  }
  const client = apiClient({
    requireUser: true,
    requireProject: true
  });

  // Check that the project has a studio hostname
  let spinner = output.spinner('Checking project info').start();
  const project = await client.projects.getById(client.config().projectId);
  let studioHostname = project && (project.studioHostname || project.studioHost);
  spinner.succeed();
  if (!studioHostname) {
    output.print('Your project has not been assigned a studio hostname.');
    output.print('To deploy your Sanity Studio to our hosted Sanity.Studio service,');
    output.print('you will need one. Please enter the part you want to use.');
    studioHostname = await prompt.single({
      type: 'input',
      filter: inp => inp.replace(/\.sanity\.studio$/i, ''),
      message: 'Studio hostname (<value>.sanity.studio):',
      validate: name => validateHostname(name, client)
    });
  }

  // Always build the project, unless --no-build is passed
  const shouldBuild = flags.build;
  if (shouldBuild) {
    const overrides = {
      project: {
        basePath: undefined
      }
    };
    const buildStaticAssets = (0, _lazyRequire.default)(require.resolve('../build/buildStaticAssets'));
    const buildArgs = [args.argsWithoutOptions[0]].filter(Boolean);
    const {
      didCompile
    } = await buildStaticAssets({
      extOptions: flags,
      argsWithoutOptions: buildArgs,
      overrides
    }, context);
    if (!didCompile) {
      return;
    }
  }

  // Ensure that the directory exists, is a directory and seems to have valid content
  spinner = output.spinner('Verifying local content').start();
  try {
    await checkDir(sourceDir);
    spinner.succeed();
  } catch (err) {
    spinner.fail();
    throw err;
  }

  // Now create a tarball of the given directory
  const parentDir = _path.default.dirname(sourceDir);
  const base = _path.default.basename(sourceDir);
  const tarball = _tarFs.default.pack(parentDir, {
    entries: [base]
  }).pipe(_zlib.default.createGzip());
  spinner = output.spinner('Deploying to Sanity.Studio').start();
  try {
    const response = await client.request({
      method: 'POST',
      url: '/deploy',
      body: tarball,
      maxRedirects: 0
    });
    spinner.succeed();

    // And let the user know we're done
    output.print(`\nSuccess! Studio deployed to ${chalk.cyan(response.location)}`);
  } catch (err) {
    spinner.fail();
    throw err;
  }
};
exports.default = _default;
async function dirIsEmptyOrNonExistent(sourceDir) {
  try {
    const stats = await _fsExtra.default.stat(sourceDir);
    if (!stats.isDirectory()) {
      throw new Error(`Directory ${sourceDir} is not a directory`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      return true;
    }
    throw err;
  }
  const content = await _fsExtra.default.readdir(sourceDir);
  return content.length === 0;
}
async function checkDir(sourceDir) {
  try {
    const stats = await _fsExtra.default.stat(sourceDir);
    if (!stats.isDirectory()) {
      throw new Error(`Directory ${sourceDir} is not a directory`);
    }
  } catch (err) {
    const error = err.code === 'ENOENT' ? new Error(`Directory "${sourceDir}" does not exist`) : err;
    throw error;
  }
  try {
    await _fsExtra.default.stat(_path.default.join(sourceDir, 'index.html'));
  } catch (err) {
    const error = err.code === 'ENOENT' ? new Error([`"${sourceDir}/index.html" does not exist -`, '[SOURCE_DIR] must be a directory containing', 'a Sanity studio built using "sanity build"'].join(' ')) : err;
    throw error;
  }
}
function validateHostname(value, client) {
  const projectId = client.config().projectId;
  const uri = `/projects/${projectId}`;
  const studioHost = value || '';

  // Check that it matches allowed character range
  if (!/^[a-z0-9_-]+$/i.test(studioHost)) {
    return 'Hostname can contain only A-Z, 0-9, _ and -';
  }

  // Check that the hostname is not already taken
  return client.request({
    uri,
    method: 'PATCH',
    body: {
      studioHost
    }
  }).then(() => true).catch(error => {
    var _error$response, _error$response$body;
    if (error !== null && error !== void 0 && (_error$response = error.response) !== null && _error$response !== void 0 && (_error$response$body = _error$response.body) !== null && _error$response$body !== void 0 && _error$response$body.message) {
      return error.response.body.message;
    }
    throw error;
  });
}