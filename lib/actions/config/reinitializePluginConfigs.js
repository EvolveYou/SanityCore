"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.tryInitializePluginConfigs = tryInitializePluginConfigs;
var _path = _interopRequireDefault(require("path"));
var _pathExists = _interopRequireDefault(require("path-exists"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _resolver = _interopRequireDefault(require("@sanity/resolver"));
var _normalizePluginName = _interopRequireDefault(require("../../util/normalizePluginName"));
var _generateConfigChecksum = _interopRequireDefault(require("../../util/generateConfigChecksum"));
var _pluginChecksumManifest = require("../../util/pluginChecksumManifest");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function reinitializePluginConfigs(options, flags = {}) {
  const {
    workDir,
    output,
    env
  } = options;
  const localChecksums = await (0, _pluginChecksumManifest.getChecksums)(workDir);
  const allPlugins = await (0, _resolver.default)({
    basePath: workDir,
    env
  });
  const pluginsWithDistConfig = (await Promise.all(allPlugins.map(pluginHasDistConfig))).filter(Boolean);
  const distChecksums = await Promise.all(pluginsWithDistConfig.map(getPluginConfigChecksum));
  const withLocalConfigs = await Promise.all(distChecksums.map(hasLocalConfig));
  const missingConfigs = await Promise.all(withLocalConfigs.map(createMissingConfig));
  const configPlugins = missingConfigs.map(warnOnDifferingChecksum);
  return missingConfigs.length > 0 ? saveNewChecksums(configPlugins) : Promise.resolve();
  function hasLocalConfig(plugin) {
    return (0, _pluginChecksumManifest.localConfigExists)(workDir, plugin.name).then(configDeployed => Object.assign({}, plugin, {
      configDeployed
    }));
  }
  function createMissingConfig(plugin) {
    if (plugin.configDeployed) {
      return plugin;
    }
    const srcPath = _path.default.join(plugin.path, 'config.dist.json');
    const dstPath = _path.default.join(workDir, 'config', `${(0, _normalizePluginName.default)(plugin.name)}.json`);
    const prtPath = _path.default.relative(workDir, dstPath);
    if (!flags.quiet) {
      output.print(`Plugin "${plugin.name}" is missing local configuration file, creating ${prtPath}`);
    }
    return _fsExtra.default.copy(srcPath, dstPath).then(() => plugin);
  }
  function warnOnDifferingChecksum(plugin) {
    return plugin;

    // Disabled for now, until we can provide a way to fix.
    // NOTE: A similar checksum diff check is also done when running the install command
    // See https://github.com/sanity-io/sanity/pull/298
    // if (flags.quiet) {
    //   return plugin
    // }
    //
    // const local = localChecksums[plugin.name]
    // if (typeof local !== 'undefined' && local !== plugin.configChecksum) {
    //   const name = normalizePluginName(plugin.name)
    //   output.print(
    //     `[WARN] Default configuration file for plugin "${name}" has changed since local copy was created`
    //   )
    // }
    //
    // return plugin
  }

  function saveNewChecksums(plugins) {
    const sums = Object.assign({}, localChecksums);
    plugins.forEach(plugin => {
      if (!sums[plugin.name]) {
        sums[plugin.name] = plugin.configChecksum;
      }
    });
    return (0, _pluginChecksumManifest.setChecksums)(workDir, sums);
  }
}
async function tryInitializePluginConfigs(options, flags = {}) {
  try {
    await reinitializePluginConfigs(options, flags);
  } catch (err) {
    if (err.code !== 'PluginNotFound') {
      throw err;
    }
    const manifest = await _fsExtra.default.readJson(_path.default.join(options.workDir, 'package.json')).catch(() => ({}));
    const dependencies = Object.keys(Object.assign({}, manifest.dependencies, manifest.devDependencies));
    const depName = err.plugin[0] === '@' ? err.plugin : `sanity-plugin-${err.plugin}`;
    if (dependencies.includes(depName)) {
      err.message = `${err.message}\n\nTry running "sanity install"?`;
    } else {
      err.message = `${err.message}\n\nTry running "sanity install ${depName}"?`;
    }
    throw err;
  }
}
var _default = reinitializePluginConfigs;
exports.default = _default;
function getPluginConfigPath(plugin) {
  return _path.default.join(plugin.path, 'config.dist.json');
}
function pluginHasDistConfig(plugin) {
  const configPath = getPluginConfigPath(plugin);
  return (0, _pathExists.default)(configPath).then(exists => exists && plugin);
}
function getPluginConfigChecksum(plugin) {
  return (0, _generateConfigChecksum.default)(getPluginConfigPath(plugin)).then(configChecksum => Object.assign({}, plugin, {
    configChecksum
  }));
}