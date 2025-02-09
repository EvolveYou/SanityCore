"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatMessage = formatMessage;
exports.isLikelyASyntaxError = isLikelyASyntaxError;
var _chalk = _interopRequireDefault(require("chalk"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const friendlySyntaxErrorLabel = 'Syntax error:';
function isLikelyASyntaxError(message) {
  return message.indexOf(friendlySyntaxErrorLabel) !== -1;
}
function formatMessage(message) {
  return message
  // Make some common errors shorter:
  .replace(
  // Babel syntax error
  'Module build failed: SyntaxError:', friendlySyntaxErrorLabel).replace(
  // Webpack file not found error
  /Module not found: Error: Cannot resolve 'file' or 'directory'/, 'Module not found:')
  // Internal stacks are generally useless so we strip them
  .replace(/^\s*at\s.*:\d+:\d+[\s)]*\n/gm, '') // at ... ...:x:y
  // Webpack loader names obscure CSS filenames
  .replace(/\.\/~\/css-loader.*?!\.\/~\/postcss-loader!/, '')
  // Make Sanity part names readable
  .replace(/(?:.*)!(\..*?)\?sanity(?:Role|Part)=(.*?)(?:&|$).*/gm, (full, path, part) => {
    return `${path} (${_chalk.default.yellow(decodeURIComponent(part))})`;
  }).replace(/\?sanity(?:Role|Part)=(.*?)(&|$).*/gm, (full, part) => {
    return ` (${_chalk.default.yellow(decodeURIComponent(part))})`;
  })
  // Make paths red
  .replace(/(\s+@\s+)([./]\S+)( \(.*?\))/g, (full, prefix, path, part) => {
    return `${prefix}${_chalk.default.red(path)}${part}`;
  });
}