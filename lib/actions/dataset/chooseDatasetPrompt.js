"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _debug = _interopRequireDefault(require("../../debug"));
var _datasetNamePrompt = _interopRequireDefault(require("./datasetNamePrompt"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = async (context, options = {}) => {
  const {
    apiClient,
    prompt
  } = context;
  const {
    message,
    allowCreation
  } = options;
  const client = apiClient();
  const datasets = await client.datasets.list();
  const hasProduction = datasets.find(dataset => dataset.name === 'production');
  const datasetChoices = datasets.map(dataset => ({
    value: dataset.name
  }));
  const selected = await prompt.single({
    message: message || 'Select dataset to use',
    type: 'list',
    choices: allowCreation ? [{
      value: 'new',
      name: 'Create new dataset'
    }, new prompt.Separator(), ...datasetChoices] : datasetChoices
  });
  if (selected === 'new') {
    (0, _debug.default)('User wants to create a new dataset, prompting for name');
    const newDatasetName = await (0, _datasetNamePrompt.default)(prompt, {
      message: 'Name your dataset:',
      default: hasProduction ? undefined : 'production'
    });
    await client.datasets.create(newDatasetName);
    return newDatasetName;
  }
  return selected;
};
exports.default = _default;