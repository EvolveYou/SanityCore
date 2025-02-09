"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _datasetNamePrompt = _interopRequireDefault(require("../../../actions/dataset/datasetNamePrompt"));
var _datasetAliasNamePrompt = _interopRequireDefault(require("../../../actions/dataset/alias/datasetAliasNamePrompt"));
var _validateDatasetAliasName = _interopRequireDefault(require("../../../actions/dataset/alias/validateDatasetAliasName"));
var _validateDatasetName = _interopRequireDefault(require("../../../actions/dataset/validateDatasetName"));
var aliasClient = _interopRequireWildcard(require("./datasetAliasesClient"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = async (args, context) => {
  const {
    apiClient,
    output,
    prompt
  } = context;
  const [, alias, targetDataset] = args.argsWithoutOptions;
  const client = apiClient();
  const nameError = alias && (0, _validateDatasetAliasName.default)(alias);
  if (nameError) {
    throw new Error(nameError);
  }
  const [datasets, aliases, projectFeatures] = await Promise.all([client.datasets.list().then(sets => sets.map(ds => ds.name)), aliasClient.listAliases(client).then(sets => sets.map(ds => ds.name)), client.request({
    uri: '/features'
  })]);
  let aliasName = await (alias || (0, _datasetAliasNamePrompt.default)(prompt));
  let aliasOutputName = aliasName;
  if (aliasName.startsWith(aliasClient.ALIAS_PREFIX)) {
    aliasName = aliasName.substring(1);
  } else {
    aliasOutputName = `${aliasClient.ALIAS_PREFIX}${aliasName}`;
  }
  if (aliases.includes(aliasName)) {
    throw new Error(`Dataset alias "${aliasOutputName}" already exists`);
  }
  if (targetDataset) {
    const datasetErr = (0, _validateDatasetName.default)(targetDataset);
    if (datasetErr) {
      throw new Error(datasetErr);
    }
  }
  const datasetName = await (targetDataset || (0, _datasetNamePrompt.default)(prompt));
  if (datasetName && !datasets.includes(datasetName)) {
    throw new Error(`Dataset "${datasetName}" does not exist `);
  }
  const canCreateAlias = projectFeatures.includes('advancedDatasetManagement');
  if (!canCreateAlias) {
    throw new Error(`This project cannot create a dataset alias`);
  }
  try {
    await aliasClient.createAlias(client, aliasName, datasetName);
    output.print(`Dataset alias ${aliasOutputName} created ${datasetName && `and linked to ${datasetName}`} successfully`);
  } catch (err) {
    throw new Error(`Dataset alias creation failed:\n${err.message}`);
  }
};
exports.default = _default;