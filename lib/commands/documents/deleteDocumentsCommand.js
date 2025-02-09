"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _pluralize = _interopRequireDefault(require("pluralize"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const helpText = `
Delete a document from the projects configured dataset

Options
  --dataset NAME to override dataset

Example
  # Delete the document with the ID "myDocId"
  sanity documents delete myDocId

  # ID wrapped in double or single quote works equally well
  sanity documents delete 'myDocId'

  # Delete document with ID "someDocId" from dataset "blog"
  sanity documents delete --dataset=blog someDocId

  # Delete the document with ID "doc1" and "doc2"
  sanity documents delete doc1 doc2
`;
var _default = {
  name: 'delete',
  group: 'documents',
  signature: '[ID] [...IDS]',
  helpText,
  description: 'Delete a document by ID',
  action: async (args, context) => {
    const {
      apiClient,
      output,
      chalk
    } = context;
    const {
      dataset
    } = args.extOptions;
    const ids = args.argsWithoutOptions.map(str => `${str}`);
    if (!ids.length) {
      throw new Error('Document ID must be specified');
    }
    const client = dataset ? apiClient().clone().config({
      dataset
    }) : apiClient();
    const transaction = ids.reduce((trx, id) => trx.delete(id), client.transaction());
    try {
      const {
        results
      } = await transaction.commit();
      const deleted = results.filter(res => res.operation === 'delete').map(res => res.id);
      const notFound = ids.filter(id => !deleted.includes(id));
      if (deleted.length > 0) {
        output.print(`Deleted ${deleted.length} ${(0, _pluralize.default)('document', deleted.length)}`);
      }
      if (notFound.length > 0) {
        output.error(chalk.red(`${(0, _pluralize.default)('Document', notFound.length)} not found: ${notFound.join(', ')}`));
      }
    } catch (err) {
      throw new Error(`Failed to delete ${(0, _pluralize.default)('document', ids.length)}:\n${err.message}`);
    }
  }
};
exports.default = _default;