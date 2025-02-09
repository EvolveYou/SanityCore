"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = async (args, context) => {
  const {
    apiClient,
    chalk,
    output,
    prompt
  } = context;
  const client = apiClient({
    requireUser: true,
    requireProject: true
  });

  // Check that the project has a studio hostname
  let spinner = output.spinner('Checking project info').start();
  const project = await client.projects.getById(client.config().projectId);
  const studioHost = project && (project.studioHost || project.studioHost);
  spinner.succeed();
  if (!studioHost) {
    output.print('Your project has not been assigned a studio hostname.');
    output.print('Nothing to undeploy.');
    return;
  }

  // Double-check
  output.print('');
  const url = `https://${chalk.yellow(studioHost)}.sanity.studio`;
  const shouldUndeploy = await prompt.single({
    type: 'confirm',
    default: false,
    message: `This will undeploy ${url} and make it unavailable for your users.
  The hostname will be available for anyone to claim.
  Are you ${chalk.red('sure')} you want to undeploy?`.trim()
  });
  if (!shouldUndeploy) {
    return;
  }
  const projectId = client.config().projectId;
  const uri = `/projects/${projectId}`;
  spinner = output.spinner('Undeploying studio').start();
  try {
    await client.request({
      uri,
      method: 'PATCH',
      body: {
        studioHost: null
      }
    });
    spinner.succeed();
  } catch (err) {
    spinner.fail();
    throw err;
  }
  output.print(`Studio undeploy scheduled. It might take a few minutes before ${url} is unavailable.`);
};
exports.default = _default;