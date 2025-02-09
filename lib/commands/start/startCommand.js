"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lazyRequire = _interopRequireDefault(require("@sanity/util/lib/lazyRequire"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Notes
  Changing the hostname or port number might require a new CORS-entry to be added.

Options
  --port <port> TCP port to start server on. [default: 3333]
  --host <host> The local network interface at which to listen. [default: "127.0.0.1"]

Examples
  sanity start --host=0.0.0.0
  sanity start --port=1942
`;
var _default = {
  name: 'start',
  signature: '[--port <port>] [--host <host>]',
  description: 'Starts a web server for the Content Studio',
  action: (0, _lazyRequire.default)(require.resolve('../../actions/start/startAction')),
  helpText
};
exports.default = _default;