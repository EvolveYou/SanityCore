"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _getIt = _interopRequireDefault(require("get-it"));
var _middleware = require("get-it/middleware");
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _import = _interopRequireDefault(require("@sanity/import"));
var _padStart = _interopRequireDefault(require("lodash/padStart"));
var _prettyMs = _interopRequireDefault(require("pretty-ms"));
var _chooseDatasetPrompt = _interopRequireDefault(require("../../actions/dataset/chooseDatasetPrompt"));
var _validateDatasetName = _interopRequireDefault(require("../../actions/dataset/validateDatasetName"));
var _debug = _interopRequireDefault(require("../../debug"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const yellow = str => `\u001b[33m${str}\u001b[39m`;
const helpText = `
Options
  --missing On duplicate document IDs, skip importing document in question
  --replace On duplicate document IDs, replace existing document with imported document
  --allow-failing-assets Skip assets that cannot be fetched/uploaded
  --replace-assets Skip reuse of existing assets

Rarely used options (should generally not be used)
  --allow-assets-in-different-dataset Allow asset documents to reference different project/dataset

Examples
  # Import "moviedb.ndjson" from the current directory to the dataset called "moviedb"
  sanity dataset import moviedb.ndjson moviedb

  # Import "moviedb.tar.gz" from the current directory to the dataset called "moviedb",
  # replacing any documents encountered that have the same document IDs
  sanity dataset import moviedb.tar.gz moviedb --replace

  # Import from a folder containing an ndjson file, such as an extracted tarball
  # retrieved through "sanity dataset export".
  sanity dataset import ~/some/folder moviedb

  # Import from a remote URL. Will download and extract the tarball to a temporary
  # location before importing it.
  sanity dataset import https://some.url/moviedb.tar.gz moviedb --replace
`;
var _default = {
  name: 'import',
  group: 'dataset',
  signature: '[FILE | FOLDER | URL] [TARGET_DATASET]',
  description: 'Import documents to given dataset from ndjson file',
  helpText,
  // eslint-disable-next-line max-statements
  action: async (args, context) => {
    const {
      apiClient,
      output,
      chalk,
      fromInitCommand
    } = context;
    const allowAssetsInDifferentDataset = args.extOptions['allow-assets-in-different-dataset'];
    const allowFailingAssets = args.extOptions['allow-failing-assets'];
    const assetConcurrency = args.extOptions['asset-concurrency'];
    const replaceAssets = args.extOptions['replace-assets'];
    const operation = getMutationOperation(args.extOptions);
    const client = apiClient();
    const [file, target] = args.argsWithoutOptions;
    if (!file) {
      throw new Error(`Source file name and target dataset must be specified ("sanity dataset import ${chalk.bold('[file]')} [dataset]")`);
    }
    const targetDataset = await determineTargetDataset(target, context);
    (0, _debug.default)(`Target dataset has been set to "${targetDataset}"`);
    const isUrl = /^https?:\/\//i.test(file);
    let inputStream;
    let assetsBase;
    let sourceIsFolder = false;
    if (isUrl) {
      (0, _debug.default)('Input is a URL, streaming from source URL');
      inputStream = await getUrlStream(file);
    } else {
      const sourceFile = _path.default.resolve(process.cwd(), file);
      const fileStats = await _fsExtra.default.stat(sourceFile).catch(() => null);
      if (!fileStats) {
        throw new Error(`${sourceFile} does not exist or is not readable`);
      }
      sourceIsFolder = fileStats.isDirectory();
      if (sourceIsFolder) {
        inputStream = sourceFile;
      } else {
        assetsBase = _path.default.dirname(sourceFile);
        inputStream = await _fsExtra.default.createReadStream(sourceFile);
      }
    }
    const importClient = client.clone().config({
      dataset: targetDataset
    });
    let currentStep;
    let currentProgress;
    let stepStart;
    let spinInterval;
    let percent;
    function onProgress(opts) {
      const lengthComputable = opts.total;
      const sameStep = opts.step == currentStep;
      percent = getPercentage(opts);
      if (lengthComputable && opts.total === opts.current) {
        clearInterval(spinInterval);
        spinInterval = null;
      }
      if (sameStep) {
        return;
      }

      // Moved to a new step
      const prevStep = currentStep;
      const prevStepStart = stepStart || Date.now();
      stepStart = Date.now();
      currentStep = opts.step;
      if (currentProgress && currentProgress.succeed) {
        const timeSpent = (0, _prettyMs.default)(Date.now() - prevStepStart, {
          secondsDecimalDigits: 2
        });
        currentProgress.text = `[100%] ${prevStep} (${timeSpent})`;
        currentProgress.succeed();
      }
      currentProgress = output.spinner(`[0%] ${opts.step} (0.00s)`).start();
      if (spinInterval) {
        clearInterval(spinInterval);
        spinInterval = null;
      }
      spinInterval = setInterval(() => {
        const timeSpent = (0, _prettyMs.default)(Date.now() - prevStepStart, {
          secondsDecimalDigits: 2
        });
        currentProgress.text = `${percent}${opts.step} (${timeSpent})`;
      }, 60);
    }
    function endTask({
      success
    }) {
      clearInterval(spinInterval);
      spinInterval = null;
      if (success) {
        const timeSpent = (0, _prettyMs.default)(Date.now() - stepStart, {
          secondsDecimalDigits: 2
        });
        currentProgress.text = `[100%] ${currentStep} (${timeSpent})`;
        currentProgress.succeed();
      } else if (currentProgress) {
        currentProgress.fail();
      }
    }

    // Start the import!
    try {
      const {
        numDocs,
        warnings
      } = await (0, _import.default)(inputStream, {
        client: importClient,
        assetsBase,
        operation,
        onProgress,
        allowFailingAssets,
        allowAssetsInDifferentDataset,
        assetConcurrency,
        replaceAssets
      });
      endTask({
        success: true
      });
      output.print('Done! Imported %d documents to dataset "%s"\n', numDocs, targetDataset);
      printWarnings(warnings, output);
    } catch (err) {
      endTask({
        success: false
      });
      const isNonRefConflict = !fromInitCommand && err.response && err.response.statusCode === 409 && err.step !== 'strengthen-references';
      if (!isNonRefConflict) {
        throw err;
      }
      const message = [err.message, '', 'You probably want either:', ' --replace (replace existing documents with same IDs)', ' --missing (only import documents that do not already exist)', ''].join('\n');
      const error = new Error(message);
      error.details = err.details;
      error.response = err.response;
      error.responseBody = err.responseBody;
      throw error;
    }
  }
};
exports.default = _default;
async function determineTargetDataset(target, context) {
  const {
    apiClient,
    output,
    prompt
  } = context;
  const client = apiClient();
  if (target) {
    const dsError = (0, _validateDatasetName.default)(target);
    if (dsError) {
      throw new Error(dsError);
    }
  }
  (0, _debug.default)('Fetching available datasets');
  const spinner = output.spinner('Fetching available datasets').start();
  const datasets = await client.datasets.list();
  spinner.succeed('[100%] Fetching available datasets');
  let targetDataset = target ? `${target}` : null;
  if (!targetDataset) {
    targetDataset = await (0, _chooseDatasetPrompt.default)(context, {
      message: 'Select target dataset',
      allowCreation: true
    });
  } else if (!datasets.find(dataset => dataset.name === targetDataset)) {
    (0, _debug.default)('Target dataset does not exist, prompting for creation');
    const shouldCreate = await prompt.single({
      type: 'confirm',
      message: `Dataset "${targetDataset}" does not exist, would you like to create it?`,
      default: true
    });
    if (!shouldCreate) {
      throw new Error(`Dataset "${targetDataset}" does not exist`);
    }
    await client.datasets.create(targetDataset);
  }
  return targetDataset;
}
function getMutationOperation(flags) {
  const {
    replace,
    missing
  } = flags;
  if (replace && missing) {
    throw new Error('Cannot use both --replace and --missing');
  }
  if (flags.replace) {
    return 'createOrReplace';
  }
  if (flags.missing) {
    return 'createIfNotExists';
  }
  return 'create';
}
function getPercentage(opts) {
  if (!opts.total) {
    return '';
  }
  const percent = Math.floor(opts.current / opts.total * 100);
  return `[${(0, _padStart.default)(percent, 3, ' ')}%] `;
}
function getUrlStream(url) {
  const request = (0, _getIt.default)([(0, _middleware.promise)({
    onlyBody: true
  })]);
  return request({
    url,
    stream: true
  });
}
function printWarnings(warnings, output) {
  const assetFails = warnings.filter(warn => warn.type === 'asset');
  if (!assetFails.length) {
    return;
  }
  const warn = (output.warn || output.print).bind(output);
  warn(yellow('⚠ Failed to import the following %s:'), assetFails.length > 1 ? 'assets' : 'asset');
  warnings.forEach(warning => {
    warn(`  ${warning.url}`);
  });
}