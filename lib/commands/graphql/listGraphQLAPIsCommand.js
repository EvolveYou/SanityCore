"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lazyRequire = _interopRequireDefault(require("@sanity/util/lib/lazyRequire"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Examples
  sanity graphql list
`;
var _default = {
  name: 'list',
  signature: '',
  group: 'graphql',
  description: 'Lists all the GraphQL endpoints deployed for this project',
  action: (0, _lazyRequire.default)(require.resolve('../../actions/graphql/listApisAction')),
  helpText
};
exports.default = _default;