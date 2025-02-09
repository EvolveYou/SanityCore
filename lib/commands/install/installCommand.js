"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _path = _interopRequireDefault(require("path"));
var _generateConfigChecksum = _interopRequireDefault(require("../../util/generateConfigChecksum"));
var _addPluginToManifest = _interopRequireDefault(require("@sanity/util/lib/addPluginToManifest"));
var _pluginChecksumManifest = require("../../util/pluginChecksumManifest");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  name: 'install',
  signature: '[PLUGIN]',
  description: 'Installs a Sanity plugin to the current Sanity configuration',
  action: async (args, context) => {
    const {
      extOptions
    } = args;
    const {
      yarn
    } = context;
    const [plugin] = args.argsWithoutOptions;
    if (!plugin) {
      const flags = extOptions.offline ? ['--offline'] : [];
      return yarn(['install'].concat(flags), context);
    }

    // @todo add support for multiple simultaneous plugins to be installed
    return installPlugin(plugin, context);
  }
};
exports.default = _default;
async function installPlugin(plugin, context) {
  const {
    output,
    workDir,
    yarn
  } = context;
  const isNamespaced = plugin[0] === '@';
  let shortName = plugin;
  let fullName = plugin;
  if (!isNamespaced) {
    const isFullName = plugin.indexOf('sanity-plugin-') === 0;
    shortName = isFullName ? plugin.substr(14) : plugin;
    fullName = isFullName ? plugin : `sanity-plugin-${plugin}`;
  }
  await yarn(['add', fullName], context);
  await (0, _addPluginToManifest.default)(workDir, shortName);
  await copyConfiguration(workDir, fullName, shortName, output);
  output.print(`Plugin '${fullName}' installed`);
}
async function copyConfiguration(rootDir, fullName, shortName, output) {
  const configPath = _path.default.join(rootDir, 'node_modules', fullName, 'config.dist.json');
  const dstPath = _path.default.join(rootDir, 'config', `${shortName}.json`);
  if (!_fsExtra.default.existsSync(configPath)) {
    return;
  }

  // Configuration exists, check if user has local configuration already
  if (
  // eslint-disable-line no-constant-condition
  false /* disabled for now until we can offer the user a way to fix this */ && _fsExtra.default.existsSync(dstPath)) {
    const distChecksum = await (0, _generateConfigChecksum.default)(configPath);
    const sameChecksum = await (0, _pluginChecksumManifest.hasSameChecksum)(rootDir, fullName, distChecksum);
    warnOnDifferentChecksum(shortName, sameChecksum, output.print);
  } else {
    // Destination file does not exist, copy
    await _fsExtra.default.copy(configPath, dstPath);
    const checksum = await (0, _generateConfigChecksum.default)(configPath);
    await (0, _pluginChecksumManifest.setChecksum)(rootDir, fullName, checksum);
  }
}

// @todo Improve with some sort of helpful key differ or similar
function warnOnDifferentChecksum(plugin, sameChecksum, printer) {
  if (!sameChecksum) {
    printer([`[Warning] Default configuration for plugin '${plugin}' has changed since you first installed it,`, 'check local configuration vs distributed configuration to ensure your configuration is up to date'].join(' '));
  }
}