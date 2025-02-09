"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lazyRequire = _interopRequireDefault(require("@sanity/util/lib/lazyRequire"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Examples
  sanity undeploy
`;
var _default = {
  name: 'undeploy',
  signature: '',
  description: 'Removes the deployed studio from <hostname>.sanity.studio',
  action: (0, _lazyRequire.default)(require.resolve('../../actions/deploy/undeployAction')),
  helpText
};
exports.default = _default;