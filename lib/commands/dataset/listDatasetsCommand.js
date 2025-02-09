"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _listAliasesHandler = _interopRequireDefault(require("./alias/listAliasesHandler"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  name: 'list',
  group: 'dataset',
  signature: '',
  description: 'List datasets of your project',
  action: async (args, context) => {
    const {
      apiClient,
      output
    } = context;
    const client = apiClient();
    const datasets = await client.datasets.list();
    output.print(datasets.map(set => set.name).join('\n'));

    // Print alias list
    await (0, _listAliasesHandler.default)(args, context);
  }
};
exports.default = _default;