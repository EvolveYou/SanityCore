"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = promptForAliasName;
var _validateDatasetAliasName = _interopRequireDefault(require("./validateDatasetAliasName"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function promptForAliasName(prompt, options = {}) {
  return prompt.single({
    type: 'input',
    message: 'Alias name:',
    validate: name => {
      const err = (0, _validateDatasetAliasName.default)(name);
      if (err) {
        return err;
      }
      return true;
    },
    ...options
  });
}