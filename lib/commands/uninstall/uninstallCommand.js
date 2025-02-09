"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _without2 = _interopRequireDefault(require("lodash/without"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _path = _interopRequireDefault(require("path"));
var _readLocalManifest = _interopRequireDefault(require("@sanity/util/lib/readLocalManifest"));
var _generateConfigChecksum = _interopRequireDefault(require("../../util/generateConfigChecksum"));
var _pluginChecksumManifest = require("../../util/pluginChecksumManifest");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  name: 'uninstall',
  signature: '[plugin]',
  description: 'Removes a Sanity plugin from the current Sanity configuration',
  action: (args, context) => {
    const {
      output
    } = context;
    const [plugin] = args.argsWithoutOptions;
    if (!plugin) {
      return output.error(new Error('Plugin name must be specified'));
    }

    // @todo add support for multiple simultaneous plugins to be uninstalled
    return uninstallPlugin(plugin, context);
  }
};
exports.default = _default;
async function uninstallPlugin(plugin, context) {
  const {
    prompt,
    yarn,
    workDir
  } = context;
  const isFullName = plugin.indexOf('sanity-plugin-') === 0;
  const shortName = isFullName ? plugin.substr(14) : plugin;
  const fullName = isFullName ? plugin : `sanity-plugin-${plugin}`;
  await removeConfiguration(workDir, fullName, shortName, prompt);
  await removeFromSanityManifest(workDir, shortName);
  return yarn(['remove', fullName], context);
}
async function removeConfiguration(workDir, fullName, shortName, prompt) {
  const localConfigPath = _path.default.join(workDir, 'config', `${shortName}.json`);
  const hasLocalConfig = await (0, _pluginChecksumManifest.localConfigExists)(workDir, shortName);
  if (!hasLocalConfig) {
    return;
  }
  try {
    const localChecksum = await (0, _generateConfigChecksum.default)(localConfigPath);
    const sameChecksum = await (0, _pluginChecksumManifest.hasSameChecksum)(workDir, fullName, localChecksum);
    const {
      deleteConfig
    } = await promptOnAlteredConfiguration(shortName, sameChecksum, prompt);
    deleteConfiguration(localConfigPath, deleteConfig);
  } catch (err) {
    // Destination file does not exist?
    // Predictable, proceed with uninstall
  }
}
async function removeFromSanityManifest(workDir, pluginName) {
  const manifest = await (0, _readLocalManifest.default)(workDir, 'sanity.json');
  manifest.plugins = (0, _without2.default)(manifest.plugins || [], pluginName);
  return _fsExtra.default.writeJson(_path.default.join(workDir, 'sanity.json'), manifest, {
    spaces: 2
  });
}
function deleteConfiguration(configPath, userConfirmed) {
  if (!userConfirmed) {
    return Promise.resolve(); // Leave the configuration in place
  }

  return _fsExtra.default.unlink(configPath);
}
function promptOnAlteredConfiguration(plugin, sameChecksum, prompt) {
  if (sameChecksum) {
    return Promise.resolve({
      deleteConfig: true
    });
  }
  return prompt([{
    type: 'confirm',
    name: 'deleteConfig',
    message: `Local configuration for '${plugin}' has modifications - remove anyway?`,
    default: true
  }]);
}