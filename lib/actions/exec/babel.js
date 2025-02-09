"use strict";

var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _register = _interopRequireDefault(require("@babel/register"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getConfig() {
  try {
    // eslint-disable-next-line no-sync
    const content = _fs.default.readFileSync(_path.default.join(process.cwd(), '.babelrc'));
    return JSON.parse(content);
  } catch (err) {
    return {
      presets: [require.resolve('@babel/preset-typescript'), require.resolve('@babel/preset-react'), [require.resolve('@babel/preset-env'), {
        targets: {
          node: 'current'
        }
      }]],
      plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
      extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx']
    };
  }
}
(0, _register.default)(getConfig());