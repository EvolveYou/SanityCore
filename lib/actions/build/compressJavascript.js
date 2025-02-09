"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _terser = _interopRequireDefault(require("terser"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * @param {string} inputFile
 */
async function _default(inputFile) {
  var _result;
  const buffer = await _fs.default.promises.readFile(inputFile);
  const outPath = `${inputFile}.min`;
  let result;
  try {
    result = await _terser.default.minify(buffer.toString(), {
      compress: true,
      mangle: true
    });
  } catch (e) {
    throw new Error(`Failed to minify bundle (${_path.default.basename(inputFile)}):\n\n${(e === null || e === void 0 ? void 0 : e.message) || 'Terser Error'}`);
  }
  if (!((_result = result) !== null && _result !== void 0 && _result.code)) {
    var _result$error;
    throw new Error(`Failed to minify bundle (${_path.default.basename(inputFile)}):\n\n${((_result$error = result.error) === null || _result$error === void 0 ? void 0 : _result$error.message) || 'No code output from Terser.'}`);
  }
  await _fs.default.promises.writeFile(outPath, result.code);
  await _fsExtra.default.unlink(inputFile);
  await _fsExtra.default.move(outPath, inputFile);
}