"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _debug = _interopRequireDefault(require("../../debug"));
var _datasetNamePrompt = _interopRequireDefault(require("../../actions/dataset/datasetNamePrompt"));
var _validateDatasetName = _interopRequireDefault(require("../../actions/dataset/validateDatasetName"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Options
  --visibility <mode> Set visibility for this dataset (public/private)

Examples
  sanity dataset create
  sanity dataset create <name>
  sanity dataset create <name> --visibility private
`;
const allowedModes = ['private', 'public'];
var _default = {
  name: 'create',
  group: 'dataset',
  signature: '[NAME]',
  helpText,
  description: 'Create a new dataset within your project',
  action: async (args, context) => {
    const {
      apiClient,
      output,
      prompt
    } = context;
    const flags = args.extOptions;
    const [dataset] = args.argsWithoutOptions;
    const client = apiClient();
    const nameError = dataset && (0, _validateDatasetName.default)(dataset);
    if (nameError) {
      throw new Error(nameError);
    }
    const [datasets, projectFeatures] = await Promise.all([client.datasets.list().then(sets => sets.map(ds => ds.name)), client.request({
      uri: '/features'
    })]);
    if (flags.visibility && !allowedModes.includes(flags.visibility)) {
      throw new Error(`Visibility mode "${flags.visibility}" not allowed`);
    }
    const datasetName = await (dataset || (0, _datasetNamePrompt.default)(prompt));
    if (datasets.includes(datasetName)) {
      throw new Error(`Dataset "${datasetName}" already exists`);
    }
    const canCreatePrivate = projectFeatures.includes('privateDataset');
    (0, _debug.default)('%s create private datasets', canCreatePrivate ? 'Can' : 'Cannot');
    const defaultAclMode = canCreatePrivate ? flags.visibility : 'public';
    const aclMode = await (defaultAclMode || promptForDatasetVisibility(prompt, output));
    try {
      await client.datasets.create(datasetName, {
        aclMode
      });
      output.print('Dataset created successfully');
    } catch (err) {
      throw new Error(`Dataset creation failed:\n${err.message}`);
    }
  }
};
exports.default = _default;
async function promptForDatasetVisibility(prompt, output) {
  const mode = await prompt.single({
    type: 'list',
    message: 'Dataset visibility',
    choices: [{
      value: 'public',
      name: 'Public (world readable)'
    }, {
      value: 'private',
      name: 'Private (Authenticated user or token needed)'
    }]
  });
  if (mode === 'private') {
    output.print('Please note that while documents are private, assets (files and images) are still public\n');
  }
  return mode;
}