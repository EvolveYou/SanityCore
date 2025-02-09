"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _helpers = require("yargs/helpers");
var _yargs = _interopRequireDefault(require("yargs/yargs"));
var _datasetAliasNamePrompt = _interopRequireDefault(require("../../../actions/dataset/alias/datasetAliasNamePrompt"));
var _validateDatasetAliasName = _interopRequireDefault(require("../../../actions/dataset/alias/validateDatasetAliasName"));
var aliasClient = _interopRequireWildcard(require("./datasetAliasesClient"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function parseCliFlags(args) {
  return (0, _yargs.default)((0, _helpers.hideBin)(args.argv || process.argv).slice(2)).option('force', {
    type: 'boolean'
  }).argv;
}
var _default = async (args, context) => {
  const {
    apiClient,
    output,
    prompt
  } = context;
  const [, alias] = args.argsWithoutOptions;
  const {
    force
  } = await parseCliFlags(args);
  const client = apiClient();
  const nameError = alias && (0, _validateDatasetAliasName.default)(alias);
  if (nameError) {
    throw new Error(nameError);
  }
  const fetchedAliases = await aliasClient.listAliases(client);
  let aliasName = await (alias || (0, _datasetAliasNamePrompt.default)(prompt));
  let aliasOutputName = aliasName;
  if (aliasName.startsWith(aliasClient.ALIAS_PREFIX)) {
    aliasName = aliasName.substring(1);
  } else {
    aliasOutputName = `${aliasClient.ALIAS_PREFIX}${aliasName}`;
  }

  // get the current alias from the remote alias list
  const linkedAlias = fetchedAliases.find(elem => elem.name === aliasName);
  if (!linkedAlias) {
    throw new Error(`Dataset alias "${aliasOutputName}" does not exist`);
  }
  if (!linkedAlias.datasetName) {
    throw new Error(`Dataset alias "${aliasOutputName}" is not linked to a dataset`);
  }
  if (force) {
    output.warn(`'--force' used: skipping confirmation, unlinking alias "${aliasOutputName}"`);
  } else {
    await prompt.single({
      type: 'input',
      message: `Are you ABSOLUTELY sure you want to unlink this alias from the "${linkedAlias.datasetName}" dataset?
        \n  Type YES/NO: `,
      filter: input => `${input}`.toLowerCase(),
      validate: input => {
        return input === 'yes' || 'Ctrl + C to cancel dataset alias unlink.';
      }
    });
  }
  try {
    const result = await aliasClient.unlinkAlias(client, aliasName);
    output.print(`Dataset alias ${aliasOutputName} unlinked from ${result.datasetName} successfully`);
  } catch (err) {
    throw new Error(`Dataset alias unlink failed:\n${err.message}`);
  }
};
exports.default = _default;