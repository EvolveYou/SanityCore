"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lazyRequire = _interopRequireDefault(require("@sanity/util/lib/lazyRequire"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Options
  --dataset <dataset> Delete GraphQL API for the given dataset
  --tag <tag> Delete GraphQL API for the given tag (defaults to 'default')
  --force Skip confirmation prompt, forcefully undeploying the GraphQL API

Examples
  sanity graphql undeploy
  sanity graphql undeploy --dataset staging
  sanity graphql undeploy --dataset staging --tag next
  sanity graphql undeploy --dataset staging --force
`;
var _default = {
  name: 'undeploy',
  group: 'graphql',
  description: 'Remove a deployed GraphQL API',
  action: (0, _lazyRequire.default)(require.resolve('../../actions/graphql/deleteApiAction')),
  helpText
};
exports.default = _default;