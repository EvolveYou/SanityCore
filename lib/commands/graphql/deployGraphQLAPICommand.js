"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lazyRequire = _interopRequireDefault(require("@sanity/util/lib/lazyRequire"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Options
  --dataset <dataset> Deploy API for the given dataset
  --tag <tag> Deploy API to given tag (defaults to 'default')
  --generation <generation> API generation to deploy (defaults to 'gen3')
  --non-null-document-fields Set document interface fields (_id, _type etc) as non-null
  --playground Deploy a GraphQL playground for easily testing queries (public)
  --no-playground Skip playground prompt (do not deploy a playground)
  --force Deploy API without confirming breaking changes

Examples
  sanity graphql deploy
  sanity graphql deploy --playground
  sanity graphql deploy --generation gen1
  sanity graphql deploy --dataset staging --no-playground
  sanity graphql deploy --dataset staging --tag next --no-playground
  sanity graphql deploy --no-playground --force
  sanity graphql deploy --playground --non-null-document-fields
  sanity graphql deploy --dry-run
`;
var _default = {
  name: 'deploy',
  signature: '',
  group: 'graphql',
  description: 'Deploy a GraphQL API from the current Sanity schema',
  action: (0, _lazyRequire.default)(require.resolve('../../actions/graphql/deployApiAction')),
  helpText
};
exports.default = _default;