"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = promptForDatasetName;
var _validateDatasetName = _interopRequireDefault(require("./validateDatasetName"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function promptForDatasetName(prompt, options = {}) {
  return prompt.single({
    type: 'input',
    message: 'Dataset name:',
    validate: name => {
      const err = (0, _validateDatasetName.default)(name);
      if (err) {
        return err;
      }
      return true;
    },
    ...options
  });
}