"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _prettyMs = _interopRequireDefault(require("pretty-ms"));
var _util = require("@sanity/util");
var _export = _interopRequireDefault(require("@sanity/export"));
var _chooseDatasetPrompt = _interopRequireDefault(require("../../actions/dataset/chooseDatasetPrompt"));
var _validateDatasetName = _interopRequireDefault(require("../../actions/dataset/validateDatasetName"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const noop = () => null;
const helpText = `
Options
  --raw                     Extract only documents, without rewriting asset references
  --no-assets               Export only non-asset documents and remove references to image assets
  --no-drafts               Export only published versions of documents
  --no-compress             Skips compressing tarball entries (still generates a gzip file)
  --types                   Defines which document types to export
  --overwrite               Overwrite any file with the same name
  --asset-concurrency <num> Concurrent number of asset downloads

Examples
  sanity dataset export moviedb localPath.tar.gz
  sanity dataset export moviedb assetless.tar.gz --no-assets
  sanity dataset export staging staging.tar.gz --raw
  sanity dataset export staging staging.tar.gz --types products,shops
`;
var _default = {
  name: 'export',
  group: 'dataset',
  signature: '[NAME] [DESTINATION]',
  description: 'Export dataset to local filesystem as a gzipped tarball',
  helpText,
  action: async (args, context) => {
    const {
      apiClient,
      output,
      chalk,
      workDir,
      prompt
    } = context;
    const client = apiClient();
    const [targetDataset, targetDestination] = args.argsWithoutOptions;
    const flags = args.extOptions;
    const {
      absolutify
    } = _util.pathTools;
    if (flags.types) {
      flags.types = `${flags.types}`.split(',');
    }
    if (flags['asset-concurrency']) {
      flags.assetConcurrency = parseInt(flags['asset-concurrency'], 10);
    }
    let dataset = targetDataset ? `${targetDataset}` : null;
    if (!dataset) {
      dataset = await (0, _chooseDatasetPrompt.default)(context, {
        message: 'Select dataset to export'
      });
    }
    const dsError = (0, _validateDatasetName.default)(dataset);
    if (dsError) {
      throw dsError;
    }

    // Verify existence of dataset before trying to export from it
    const datasets = await client.datasets.list();
    if (!datasets.find(set => set.name === dataset)) {
      throw new Error(`Dataset with name "${dataset}" not found`);
    }
    let destinationPath = targetDestination;
    if (!destinationPath) {
      destinationPath = await prompt.single({
        type: 'input',
        message: 'Output path:',
        default: _path.default.join(workDir, `${dataset}.tar.gz`),
        filter: absolutify
      });
    }
    const outputPath = await getOutputPath(destinationPath, dataset, prompt, flags);
    if (!outputPath) {
      output.print('Cancelled');
      return;
    }

    // If we are dumping to a file, let the user know where it's at
    if (outputPath !== '-') {
      output.print(`Exporting dataset "${chalk.cyan(dataset)}" to "${chalk.cyan(outputPath)}"`);
    }
    let currentStep = 'Exporting documents...';
    let spinner = output.spinner(currentStep).start();
    const onProgress = progress => {
      if (progress.step !== currentStep) {
        spinner.succeed();
        spinner = output.spinner(progress.step).start();
      } else if (progress.step === currentStep && progress.update) {
        spinner.text = `${progress.step} (${progress.current}/${progress.total})`;
      }
      currentStep = progress.step;
    };
    const start = Date.now();
    try {
      await (0, _export.default)({
        client,
        dataset,
        outputPath,
        onProgress,
        ...flags
      });
      spinner.succeed();
    } catch (err) {
      spinner.fail();
      throw err;
    }
    output.print(`Export finished (${(0, _prettyMs.default)(Date.now() - start)})`);
  }
}; // eslint-disable-next-line complexity
exports.default = _default;
async function getOutputPath(destination, dataset, prompt, flags) {
  if (destination === '-') {
    return '-';
  }
  const dstPath = _path.default.isAbsolute(destination) ? destination : _path.default.resolve(process.cwd(), destination);
  let dstStats = await _fsExtra.default.stat(dstPath).catch(noop);
  const looksLikeFile = dstStats ? dstStats.isFile() : _path.default.basename(dstPath).indexOf('.') !== -1;
  if (!dstStats) {
    const createPath = looksLikeFile ? _path.default.dirname(dstPath) : dstPath;
    await _fsExtra.default.mkdirs(createPath);
  }
  const finalPath = looksLikeFile ? dstPath : _path.default.join(dstPath, `${dataset}.tar.gz`);
  dstStats = await _fsExtra.default.stat(finalPath).catch(noop);
  if (!flags.overwrite && dstStats && dstStats.isFile()) {
    const shouldOverwrite = await prompt.single({
      type: 'confirm',
      message: `File "${finalPath}" already exists, would you like to overwrite it?`,
      default: false
    });
    if (!shouldOverwrite) {
      return false;
    }
  }
  return finalPath;
}