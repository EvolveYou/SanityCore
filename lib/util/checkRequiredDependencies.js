"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkRequiredDependencies = checkRequiredDependencies;
var _path = _interopRequireDefault(require("path"));
var _execa = _interopRequireDefault(require("execa"));
var _semver = _interopRequireDefault(require("semver"));
var _resolveFrom = _interopRequireDefault(require("resolve-from"));
var _fsExtra = require("fs-extra");
var _oneline = _interopRequireDefault(require("oneline"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const defaultStudioManifestProps = {
  name: 'studio',
  version: '1.0.0'
};
/**
 * Checks that the studio has declared and installed the required dependencies
 * needed by the Sanity modules. While we generally use regular, explicit
 * dependencies in modules, there are certain dependencies that are better
 * served being peer dependencies, such as react and styled-components.
 *
 * If these dependencies are not installed/declared, we want to prompt the user
 * whether or not to add them to `package.json` and install them using yarn/npm
 */
async function checkRequiredDependencies(context) {
  const {
    workDir: studioPath,
    output
  } = context;
  const [basePeerDependencies, studioPackageManifest, installedStyledComponentsVersion] = await Promise.all([await readBasePeerDependencies(studioPath), await readPackageManifest(_path.default.join(studioPath, 'package.json'), defaultStudioManifestProps), await readModuleVersion(studioPath, 'styled-components')]);

  // If the `@sanity/base` package.json does not have a `styled-components` peer dependency
  // declared, the user is probably running an old version of `@sanity/base`. This is a bit
  // of an indeterminate state, so we'll just have to accept it and assume things will work.
  const wantedStyledComponentsVersionRange = basePeerDependencies['styled-components'];
  if (!wantedStyledComponentsVersionRange) {
    return {
      didInstall: false
    };
  }

  // The studio _must_ now declare `styled-components` as a dependency. If it's not there,
  // we'll want to automatically _add it_ to the manifest and tell the user to reinstall
  // dependencies before running whatever command was being run
  const declaredStyledComponentsVersion = studioPackageManifest.dependencies['styled-components'];
  if (!declaredStyledComponentsVersion) {
    const [file, ...args] = process.argv;
    const deps = {
      'styled-components': wantedStyledComponentsVersionRange
    };
    await installDependenciesWithPrompt(deps, context);

    // Re-run the same command (sanity start/sanity build etc) after installation,
    // as it can have shifted the entire `node_modules` folder around, result in
    // broken assumptions about installation paths. This is a hack, and should be
    // solved properly.
    await (0, _execa.default)(file, args, {
      cwd: studioPath,
      stdio: 'inherit'
    });
    return {
      didInstall: true
    };
  }

  // Theoretically the version specified in package.json could be incorrect, eg `foo`
  let minDeclaredStyledComponentsVersion = null;
  try {
    minDeclaredStyledComponentsVersion = _semver.default.minVersion(declaredStyledComponentsVersion);
  } catch (err) {
    // Intentional fall-through (variable will be left as null, throwing below)
  }
  if (!minDeclaredStyledComponentsVersion) {
    throw new Error((0, _oneline.default)`
      Declared dependency \`styled-components\` has an invalid version range:
      \`${declaredStyledComponentsVersion}\`.
    `);
  }

  // The declared version should be semver-compatible with the version specified as a
  // peer dependency in `@sanity/base`. If not, we should tell the user to change it.
  //
  // Exception: Ranges are hard to compare. `>=5.0.0 && <=5.3.2 || ^6`... Comparing this
  // to anything is going to be challenging, so only compare "simple" ranges/versions
  // (^x.x.x / ~x.x.x / x.x.x)
  if (isComparableRange(declaredStyledComponentsVersion) && !_semver.default.satisfies(minDeclaredStyledComponentsVersion, wantedStyledComponentsVersionRange)) {
    output.warn((0, _oneline.default)`
      Declared version of styled-components (${declaredStyledComponentsVersion})
      is not compatible with the version required by @sanity/base (${wantedStyledComponentsVersionRange}).
      This might cause problems!
    `);
  }

  // Ensure the studio has _installed_ a version of `styled-components`
  if (!installedStyledComponentsVersion) {
    throw new Error((0, _oneline.default)`
      Declared dependency \`styled-components\` is not installed - run
      \`npm install\` or \`yarn\` to install it before re-running this command.
    `);
  }

  // The studio should have an _installed_ version of `styled-components`, and it should
  // be semver compatible with the version specified in `@sanity/base` peer dependencies.
  if (!_semver.default.satisfies(installedStyledComponentsVersion, wantedStyledComponentsVersionRange)) {
    output.warn((0, _oneline.default)`
      Installed version of styled-components (${installedStyledComponentsVersion})
      is not compatible with the version required by @sanity/base (${wantedStyledComponentsVersionRange}).
      This might cause problems!
    `);
  }
  return {
    didInstall: false
  };
}

/**
 * Read the declared peer dependencies of the installed `@sanity/base` module
 *
 * @param studioPath Path to the studio, in order to resolve `@sanity/base`
 * @returns Object of peer dependencies (name => version), if any
 */
async function readBasePeerDependencies(studioPath) {
  const manifestPath = _resolveFrom.default.silent(studioPath, _path.default.join('@sanity/base', 'package.json'));

  // If we can't resolve the manifest path, that means `@sanity/base` is not installed
  if (!manifestPath) {
    throw new Error('Failed to resolve @sanity/base/package.json - install dependencies with `npm install` or `yarn`.');
  }
  const {
    peerDependencies
  } = await readPackageManifest(manifestPath);
  return peerDependencies;
}

/**
 * Reads the version number of the _installed_ module, or returns `null` if not found
 *
 * @param studioPath Path of the studio
 * @param moduleName Name of module to get installed version for
 * @returns Version number, of null
 */
async function readModuleVersion(studioPath, moduleName) {
  const manifestPath = _resolveFrom.default.silent(studioPath, _path.default.join(moduleName, 'package.json'));
  return manifestPath ? (await readPackageManifest(manifestPath)).version : null;
}

/**
 * Read the `package.json` file at the given path and return an object that guarantees
 * the presence of name, version, dependencies, dev dependencies and peer dependencies
 *
 * @param packageJsonPath Path to package.json to read
 * @returns Reduced package.json with guarantees for name, version and dependency fields
 */
async function readPackageManifest(packageJsonPath, defaults = {}) {
  let manifest;
  try {
    manifest = {
      ...defaults,
      ...(await (0, _fsExtra.readJSON)(packageJsonPath))
    };
  } catch (err) {
    throw new Error(`Failed to read "${packageJsonPath}": ${err.message}`);
  }
  if (!isPackageManifest(manifest)) {
    throw new Error(`Failed to read "${packageJsonPath}": Invalid package manifest`);
  }
  const {
    name,
    version,
    dependencies = {},
    devDependencies = {},
    peerDependencies = {}
  } = manifest;
  return {
    name,
    version,
    dependencies,
    devDependencies,
    peerDependencies
  };
}

/**
 * Install the passed dependencies at the given version/version range,
 * prompting the user whether to use yarn or npm. If a `yarn.lock` file
 * is found in the working directory, we will default the choice to yarn
 *
 * @param dependencies Object of dependencies (package name => version)
 * @param context CLI context
 */
async function installDependenciesWithPrompt(dependencies, context) {
  const {
    output,
    prompt,
    workDir,
    yarn
  } = context;
  const yarnLockExists = await fileExists(_path.default.join(workDir, 'yarn.lock'));
  const installPackageArgs = [];
  const isInteractive =
  // eslint-disable-next-line no-process-env
  process.stdout.isTTY && process.env.TERM !== 'dumb' && !('CI' in process.env);
  output.print('The Sanity studio needs to install missing dependencies:');
  for (const [pkgName, version] of Object.entries(dependencies)) {
    const declaration = `${pkgName}@${version}`;
    output.print(`- ${declaration}`);
    installPackageArgs.push(declaration);
  }
  const defaultPkgManager = yarnLockExists ? 'yarn' : 'npm';
  const pkgManager = isInteractive ? await prompt.single({
    type: 'list',
    message: 'Would you like to use npm or yarn to install these?',
    choices: ['npm', 'yarn'],
    default: defaultPkgManager
  }) : defaultPkgManager;
  if (pkgManager === 'yarn') {
    await yarn(['add', ...installPackageArgs], {
      error: output.error,
      print: output.print,
      rootDir: workDir
    });
  } else {
    const npmArgs = ['install', '--legacy-peer-deps', '--save', ...installPackageArgs];
    output.print(`Running 'npm ${npmArgs.join(' ')}'`);
    await (0, _execa.default)('npm', npmArgs, {
      cwd: workDir,
      stdio: 'inherit'
    });
  }
}
function isPackageManifest(item) {
  return typeof item === 'object' && item !== null && 'name' in item && 'version' in item;
}
function isComparableRange(range) {
  return /^[\^~]?\d+(\.\d+)?(\.\d+)?$/.test(range);
}

/**
 * fs-extra `fse.exists` seems both incorrectly typed (callback based) and is
 * deprecated because it's a potential race condition to check for a file and
 * then use it. In this situation we're fine with this potentially happening.
 *
 * @param filePath Path to file we want to check for the existance of
 * @returns True if it exists, false otherwise
 */
function fileExists(filePath) {
  return (0, _fsExtra.access)(filePath).then(() => true).catch(() => false);
}