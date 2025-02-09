"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _oneline = _interopRequireDefault(require("oneline"));
var _createAliasHandler = _interopRequireDefault(require("./createAliasHandler"));
var _deleteAliasHandler = _interopRequireDefault(require("./deleteAliasHandler"));
var _unlinkAliasHandler = _interopRequireDefault(require("./unlinkAliasHandler"));
var _linkAliasHandler = _interopRequireDefault(require("./linkAliasHandler"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Below are examples of the alias subcommand

Create Alias
  sanity dataset alias create
  sanity dataset alias create <alias-name>
  sanity dataset alias create <alias-name> <target-dataset>

Delete Alias
  sanity dataset alias delete <alias-name>

Link Alias
  Options
    --force Skips security prompt and forces link command

  Usage
    sanity dataset alias link
    sanity dataset alias link <alias-name>
    sanity dataset alias link <alias-name> <target-dataset>

Un-link Alias
  sanity dataset alias unlink
  sanity dataset alias unlink <alias-name>
  sanity dataset alias unlink <alias-name> --force
`;
var _default = {
  name: 'alias',
  group: 'dataset',
  signature: 'SUBCOMMAND [ALIAS_NAME, TARGET_DATASET]',
  helpText,
  description: 'You can manage your dataset alias using this command.',
  action: async (args, context) => {
    const [verb] = args.argsWithoutOptions;
    switch (verb) {
      case 'create':
        await (0, _createAliasHandler.default)(args, context);
        break;
      case 'delete':
        await (0, _deleteAliasHandler.default)(args, context);
        break;
      case 'unlink':
        await (0, _unlinkAliasHandler.default)(args, context);
        break;
      case 'link':
        await (0, _linkAliasHandler.default)(args, context);
        break;
      default:
        throw new Error((0, _oneline.default)`
          Invalid command provided. Available commands are: create, delete, link and unlink.
          For more guide run the help command 'sanity dataset alias --help'
        `);
    }
  }
};
exports.default = _default;