"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lazyRequire = _interopRequireDefault(require("@sanity/util/lib/lazyRequire"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Options
  --source-maps Enable source maps for built bundles (increases size of bundle)
  --no-minify Skip minifying built JavaScript (speeds up build, increases size of bundle)
  --no-build Don't build the studio prior to deploy, instead deploying the version currently in \`dist/\`

Examples
  sanity deploy
  sanity deploy --no-minify --source-maps
`;
var _default = {
  name: 'deploy',
  signature: '[SOURCE_DIR] [--no-build]  [--source-maps] [--no-minify]',
  description: 'Deploys a statically built Sanity studio',
  action: (0, _lazyRequire.default)(require.resolve('../../actions/deploy/deployAction')),
  helpText
};
exports.default = _default;