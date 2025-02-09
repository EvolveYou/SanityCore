"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reinitializePluginConfigs = _interopRequireDefault(require("../../actions/config/reinitializePluginConfigs"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  name: 'configcheck',
  signature: '',
  description: 'Checks if the required configuration files for plugins exists and are up to date',
  action: (args, context) => (0, _reinitializePluginConfigs.default)(context, args.extOptions)
};
exports.default = _default;