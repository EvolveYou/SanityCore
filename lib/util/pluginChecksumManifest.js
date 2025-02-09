"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getChecksum = getChecksum;
exports.getChecksums = getChecksums;
exports.getChecksumsPath = getChecksumsPath;
exports.hasSameChecksum = hasSameChecksum;
exports.localConfigExists = localConfigExists;
exports.setChecksum = setChecksum;
exports.setChecksums = setChecksums;
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _pathExists = _interopRequireDefault(require("path-exists"));
var _path = _interopRequireDefault(require("path"));
var _normalizePluginName = _interopRequireDefault(require("./normalizePluginName"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const baseChecksums = {
  '#': 'Used by Sanity to keep track of configuration file checksums, do not delete or modify!'
};
function setChecksum(sanityPath, pluginName, checksum) {
  return getChecksums(sanityPath).then(checksums => {
    checksums[pluginName] = checksum;
    return _fsExtra.default.writeJson(getChecksumsPath(sanityPath), checksums, {
      spaces: 2
    });
  });
}
function setChecksums(sanityPath, checksums) {
  const sums = Object.assign({}, baseChecksums, checksums);
  return _fsExtra.default.writeJson(getChecksumsPath(sanityPath), sums, {
    spaces: 2
  });
}
function getChecksum(sanityPath, pluginName) {
  return getChecksums(sanityPath).then(sums => sums[pluginName]);
}
function getChecksums(sanityPath) {
  return _fsExtra.default.readJson(getChecksumsPath(sanityPath)).catch(() => baseChecksums);
}
function getChecksumsPath(sanityPath) {
  return _path.default.join(sanityPath, 'config', '.checksums');
}
function hasSameChecksum(sanityPath, pluginName, checksum) {
  return getChecksum(sanityPath, pluginName).then(sum => sum === checksum);
}
function localConfigExists(sanityPath, pluginName) {
  const name = (0, _normalizePluginName.default)(pluginName);
  return (0, _pathExists.default)(_path.default.join(sanityPath, 'config', `${name}.json`));
}