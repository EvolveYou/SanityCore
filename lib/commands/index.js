"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _buildCommand = _interopRequireDefault(require("./build/buildCommand"));
var _checkCommand = _interopRequireDefault(require("./check/checkCommand"));
var _configCheckCommand = _interopRequireDefault(require("./config/configCheckCommand"));
var _datasetGroup = _interopRequireDefault(require("./dataset/datasetGroup"));
var _deployCommand = _interopRequireDefault(require("./deploy/deployCommand"));
var _undeployCommand = _interopRequireDefault(require("./deploy/undeployCommand"));
var _listDatasetsCommand = _interopRequireDefault(require("./dataset/listDatasetsCommand"));
var _createDatasetCommand = _interopRequireDefault(require("./dataset/createDatasetCommand"));
var _datasetVisibilityCommand = _interopRequireDefault(require("./dataset/datasetVisibilityCommand"));
var _deleteDatasetCommand = _interopRequireDefault(require("./dataset/deleteDatasetCommand"));
var _exportDatasetCommand = _interopRequireDefault(require("./dataset/exportDatasetCommand"));
var _importDatasetCommand = _interopRequireDefault(require("./dataset/importDatasetCommand"));
var _copyDatasetCommand = _interopRequireDefault(require("./dataset/copyDatasetCommand"));
var _aliasCommands = _interopRequireDefault(require("./dataset/alias/aliasCommands"));
var _documentsGroup = _interopRequireDefault(require("./documents/documentsGroup"));
var _getDocumentsCommand = _interopRequireDefault(require("./documents/getDocumentsCommand"));
var _queryDocumentsCommand = _interopRequireDefault(require("./documents/queryDocumentsCommand"));
var _deleteDocumentsCommand = _interopRequireDefault(require("./documents/deleteDocumentsCommand"));
var _createDocumentsCommand = _interopRequireDefault(require("./documents/createDocumentsCommand"));
var _installCommand = _interopRequireDefault(require("./install/installCommand"));
var _startCommand = _interopRequireDefault(require("./start/startCommand"));
var _uninstallCommand = _interopRequireDefault(require("./uninstall/uninstallCommand"));
var _hookGroup = _interopRequireDefault(require("./hook/hookGroup"));
var _createHookCommand = _interopRequireDefault(require("./hook/createHookCommand"));
var _deleteHookCommand = _interopRequireDefault(require("./hook/deleteHookCommand"));
var _listHooksCommand = _interopRequireDefault(require("./hook/listHooksCommand"));
var _printHookAttemptCommand = _interopRequireDefault(require("./hook/printHookAttemptCommand"));
var _listHookLogsCommand = _interopRequireDefault(require("./hook/listHookLogsCommand"));
var _execCommand = _interopRequireDefault(require("./exec/execCommand"));
var _corsGroup = _interopRequireDefault(require("./cors/corsGroup"));
var _addCorsOriginCommand = _interopRequireDefault(require("./cors/addCorsOriginCommand"));
var _listCorsOriginsCommand = _interopRequireDefault(require("./cors/listCorsOriginsCommand"));
var _deleteCorsOriginCommand = _interopRequireDefault(require("./cors/deleteCorsOriginCommand"));
var _graphqlGroup = _interopRequireDefault(require("./graphql/graphqlGroup"));
var _listGraphQLAPIsCommand = _interopRequireDefault(require("./graphql/listGraphQLAPIsCommand"));
var _deployGraphQLAPICommand = _interopRequireDefault(require("./graphql/deployGraphQLAPICommand"));
var _deleteGraphQLAPICommand = _interopRequireDefault(require("./graphql/deleteGraphQLAPICommand"));
var _usersGroup = _interopRequireDefault(require("./users/usersGroup"));
var _inviteUserCommand = _interopRequireDefault(require("./users/inviteUserCommand"));
var _listUsersCommand = _interopRequireDefault(require("./users/listUsersCommand"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = [_buildCommand.default, _checkCommand.default, _configCheckCommand.default, _datasetGroup.default, _deployCommand.default, _undeployCommand.default, _listDatasetsCommand.default, _createDatasetCommand.default, _datasetVisibilityCommand.default, _exportDatasetCommand.default, _importDatasetCommand.default, _deleteDatasetCommand.default, _copyDatasetCommand.default, _aliasCommands.default, _corsGroup.default, _listCorsOriginsCommand.default, _addCorsOriginCommand.default, _deleteCorsOriginCommand.default, _usersGroup.default, _inviteUserCommand.default, _listUsersCommand.default, _hookGroup.default, _listHooksCommand.default, _createHookCommand.default, _deleteHookCommand.default, _listHookLogsCommand.default, _printHookAttemptCommand.default, _documentsGroup.default, _getDocumentsCommand.default, _queryDocumentsCommand.default, _deleteDocumentsCommand.default, _createDocumentsCommand.default, _graphqlGroup.default, _listGraphQLAPIsCommand.default, _deployGraphQLAPICommand.default, _deleteGraphQLAPICommand.default, _installCommand.default, _startCommand.default, _uninstallCommand.default, _execCommand.default];
exports.default = _default;