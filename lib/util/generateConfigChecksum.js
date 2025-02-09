"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _crypto = _interopRequireDefault(require("crypto"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _deepSortObject = _interopRequireDefault(require("deep-sort-object"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function generateConfigChecksum(configPath) {
  return _fsExtra.default.readJson(configPath).then(_deepSortObject.default).then(generateChecksum);
}
function generateChecksum(obj) {
  return _crypto.default.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}
var _default = generateConfigChecksum;
exports.default = _default;