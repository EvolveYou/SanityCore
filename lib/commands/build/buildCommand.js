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
  -y, --yes Use unattended mode, accepting defaults and using only flags for choices

Examples
  sanity build
  sanity build --no-minify --source-maps
`;
var _default = {
  name: 'build',
  signature: '[OUTPUT_DIR]',
  description: 'Builds the current Sanity configuration to a static bundle',
  action: (0, _lazyRequire.default)(require.resolve('../../actions/build/buildStaticAssets')),
  helpText
};
exports.default = _default;