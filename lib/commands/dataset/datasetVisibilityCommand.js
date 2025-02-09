"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _validateDatasetName = _interopRequireDefault(require("../../actions/dataset/validateDatasetName"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  name: 'visibility',
  group: 'dataset',
  signature: 'get/set [dataset] [mode]',
  description: 'Set visibility of a dataset',
  action: async (args, context) => {
    const {
      apiClient,
      output
    } = context;
    const [action, ds, aclMode] = args.argsWithoutOptions;
    const client = apiClient();
    if (!client.datasets.edit) {
      throw new Error('@sanity/cli must be upgraded first:\n  npm install -g @sanity/cli');
    }
    if (!action) {
      throw new Error('Action must be provided (get/set)');
    }
    if (!['set', 'get'].includes(action)) {
      throw new Error('Invalid action (only get/set allowed)');
    }
    if (!ds) {
      throw new Error('Dataset name must be provided');
    }
    if (action === 'set' && !aclMode) {
      throw new Error('Please provide a visibility mode (public/private)');
    }
    const dataset = `${ds}`;
    const dsError = (0, _validateDatasetName.default)(dataset);
    if (dsError) {
      throw new Error(dsError);
    }
    const current = (await client.datasets.list()).find(curr => curr.name === dataset);
    if (!current) {
      throw new Error('Dataset not found');
    }
    if (action === 'get') {
      output.print(current.aclMode);
      return;
    }
    if (current.aclMode === aclMode) {
      output.print(`Dataset already in "${aclMode}"-mode`);
      return;
    }
    if (aclMode === 'private') {
      output.print('Please note that while documents are private, assets (files and images) are still public\n');
    }
    await client.datasets.edit(dataset, {
      aclMode
    });
    output.print('Dataset visibility changed');
  }
};
exports.default = _default;