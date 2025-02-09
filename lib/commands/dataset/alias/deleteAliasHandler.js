"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _helpers = require("yargs/helpers");
var _yargs = _interopRequireDefault(require("yargs/yargs"));
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
    prompt,
    output
  } = context;
  const [, ds] = args.argsWithoutOptions;
  const {
    force
  } = await parseCliFlags(args);
  const client = apiClient();
  if (!ds) {
    throw new Error('Dataset alias name must be provided');
  }
  let aliasName = `${ds}`;
  const dsError = (0, _validateDatasetAliasName.default)(aliasName);
  if (dsError) {
    throw dsError;
  }
  aliasName = aliasName.startsWith(aliasClient.ALIAS_PREFIX) ? aliasName.substring(1) : aliasName;
  const [fetchedAliases] = await Promise.all([aliasClient.listAliases(client)]);
  const linkedAlias = fetchedAliases.find(elem => elem.name === aliasName);
  const message = linkedAlias && linkedAlias.datasetName ? `This dataset alias is linked to ${linkedAlias.datasetName}. ` : '';
  if (force) {
    output.warn(`'--force' used: skipping confirmation, deleting alias "${aliasName}"`);
  } else {
    await prompt.single({
      type: 'input',
      message: `${message}Are you ABSOLUTELY sure you want to delete this dataset alias?\n  Type the name of the dataset alias to confirm delete: `,
      filter: input => `${input}`.trim(),
      validate: input => {
        return input === aliasName || 'Incorrect dataset alias name. Ctrl + C to cancel delete.';
      }
    });
  }

  // Strip out alias prefix if it exist in the string
  aliasName = aliasName.startsWith(aliasClient.ALIAS_PREFIX) ? aliasName.substring(1) : aliasName;
  return aliasClient.removeAlias(client, aliasName).then(() => {
    output.print('Dataset alias deleted successfully');
  });
};
exports.default = _default;