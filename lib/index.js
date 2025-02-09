"use strict";

var _commands = _interopRequireDefault(require("./commands"));
var _requiredCliVersionRange = _interopRequireDefault(require("./requiredCliVersionRange"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Must be module.exports (commonjs)
module.exports = {
  commands: _commands.default,
  requiredCliVersionRange: _requiredCliVersionRange.default
};