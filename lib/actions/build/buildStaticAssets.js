"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = buildStaticAssets;
var _path = _interopRequireDefault(require("path"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _rimraf = _interopRequireDefault(require("rimraf"));
var _filesize = _interopRequireDefault(require("filesize"));
var _es6Promisify = require("es6-promisify");
var _v = _interopRequireDefault(require("@sanity/webpack-integration/v3"));
var _getConfig = _interopRequireDefault(require("@sanity/util/lib/getConfig"));
var _server = require("@sanity/server");
var _sortModulesBySize = _interopRequireDefault(require("../../stats/sortModulesBySize"));
var _checkStudioDependencyVersions = _interopRequireDefault(require("../../util/checkStudioDependencyVersions"));
var _checkRequiredDependencies = require("../../util/checkRequiredDependencies");
var _reinitializePluginConfigs = require("../config/reinitializePluginConfigs");
var _compressJavascript = _interopRequireDefault(require("./compressJavascript"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const rimraf = (0, _es6Promisify.promisify)(_rimraf.default);
const absoluteMatch = /^https?:\/\//i;
async function buildStaticAssets(args, context) {
  const overrides = args.overrides || {};
  const {
    output,
    prompt,
    workDir
  } = context;
  const flags = Object.assign({
    minify: true,
    profile: false,
    stats: false,
    'source-maps': false
  }, args.extOptions);
  const unattendedMode = flags.yes || flags.y;
  const defaultOutputDir = _path.default.resolve(_path.default.join(workDir, 'dist'));
  const outputDir = _path.default.resolve(args.argsWithoutOptions[0] || defaultOutputDir);
  const config = (0, _getConfig.default)(workDir, {
    env: 'production'
  });
  const compilationConfig = {
    env: 'production',
    staticPath: resolveStaticPath(workDir, config.get('server')),
    basePath: workDir,
    outputPath: _path.default.join(outputDir, 'static'),
    sourceMaps: flags['source-maps'],
    skipMinify: !flags.minify,
    profile: flags.profile,
    project: Object.assign({}, config.get('project'), overrides.project)
  };
  await (0, _reinitializePluginConfigs.tryInitializePluginConfigs)({
    workDir,
    output,
    env: 'production'
  });
  await (0, _checkStudioDependencyVersions.default)(workDir);

  // If the check resulted in a dependency install, the CLI command will be re-run,
  // thus we want to exit early
  if ((await (0, _checkRequiredDependencies.checkRequiredDependencies)(context)).didInstall) {
    return {
      didCompile: false
    };
  }
  const envVars = _v.default.getSanityEnvVars({
    env: 'production',
    basePath: workDir
  });
  const envVarKeys = Object.keys(envVars);
  if (envVarKeys.length > 0) {
    output.print('\nIncluding the following environment variables as part of the JavaScript bundle:');
    envVarKeys.forEach(key => output.print(`- ${key}`));
    output.print('');
  }
  const compiler = (0, _server.getWebpackCompiler)(compilationConfig);
  const compile = (0, _es6Promisify.promisify)(compiler.run.bind(compiler));
  let shouldDelete = true;
  if (outputDir !== defaultOutputDir && !unattendedMode) {
    shouldDelete = await prompt.single({
      type: 'confirm',
      message: `Do you want to delete the existing directory (${outputDir}) first?`,
      default: true
    });
  }
  let spin;
  if (shouldDelete) {
    const deleteStart = Date.now();
    spin = output.spinner('Clearing output folder').start();
    await rimraf(outputDir);
    spin.text = `Clearing output folder (${Date.now() - deleteStart}ms)`;
    spin.succeed();
  }
  spin = output.spinner('Building Sanity').start();
  const bundle = {
    didCompile: true
  };
  try {
    // Compile the bundle
    const statistics = await compile();
    const stats = statistics.toJson();
    if (stats.errors && stats.errors.length > 0) {
      throw new Error(`Errors while building:\n\n${stats.errors.join('\n\n')}`);
    }
    spin.text = `Building Sanity (${stats.time}ms)`;
    spin.succeed();

    // Get hashes for each chunk
    const chunkMap = {};
    stats.chunks.forEach(chunk => chunk.files.forEach(file => {
      chunkMap[file] = chunk.hash;
    }));
    bundle.stats = stats;
    if (flags.profile) {
      await _fsExtra.default.writeFile(_path.default.join(workDir, 'build-stats.json'), JSON.stringify(statistics.toJson('verbose')));
    }

    // Build new index document with correct hashes
    const indexStart = Date.now();
    spin = output.spinner('Building index document').start();
    const doc = await (0, _server.getDocumentElement)({
      ...compilationConfig,
      hashes: chunkMap
    }, {
      scripts: ['vendor.bundle.js', 'app.bundle.js'].map(asset => {
        const assetPath = absoluteMatch.test(asset) ? asset : `js/${asset}`;
        return {
          path: assetPath,
          hash: chunkMap[assetPath] || chunkMap[asset]
        };
      })
    });

    // Write index file to output destination
    await _fsExtra.default.writeFile(_path.default.join(outputDir, 'index.html'), `<!doctype html>${_server.ReactDOM.renderToStaticMarkup(doc)}`);

    // Print build output, optionally stats if requested
    bundle.stats.warnings.forEach(output.print);
    spin.text = `Building index document (${Date.now() - indexStart}ms)`;
    spin.succeed();
    if (flags.stats) {
      output.print('\nLargest modules (unminified, uncompressed sizes):');
      (0, _sortModulesBySize.default)(bundle.stats.modules).slice(0, 10).forEach(module => output.print(`[${(0, _filesize.default)(module.size)}] ${module.name}`));
    }

    // Now compress the JS bundles
    if (!compilationConfig.skipMinify) {
      spin = output.spinner('Minifying JavaScript bundles').start();
      const compressStart = Date.now();
      await Promise.all(Object.keys(chunkMap).filter(fileName => _path.default.extname(fileName) === '.js').map(fileName => _path.default.join(compilationConfig.outputPath, fileName)).map(_compressJavascript.default));
      spin.text = `Minifying JavaScript bundles (${Date.now() - compressStart}ms)`;
      spin.succeed();
    }

    // Copy static assets (from /static folder) to output dir
    await _fsExtra.default.copy(_path.default.join(workDir, 'static'), _path.default.join(outputDir, 'static'), {
      overwrite: false
    }).catch(err => {
      // Allow missing static folder
      if (err.code !== 'ENOENT') {
        throw err;
      }
    });
  } catch (err) {
    spin.fail();
    throw err;
  }
  return bundle;
}
function resolveStaticPath(rootDir, config) {
  const {
    staticPath
  } = config;
  return _path.default.isAbsolute(staticPath) ? staticPath : _path.default.resolve(_path.default.join(rootDir, staticPath));
}