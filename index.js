const core = require('@actions/core');
const { context } = require('@actions/github');
const { Octokit } = require('@octokit/rest');

(async () => {
  try {
    const token = core.getInput('repo-token');
    const workflow_id = core.getInput('workflow');
    const head_sha = core.getInput('head-sha', { required: false }) || context.sha;

    const octokit = new Octokit({ auth: token });
    const { owner, repo } = context.repo;

    const { data: { workflow_runs: runs } } = await octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id,
      head_sha,
    });

    if (runs.length < 1) {
      core.setFailed(`There are no runs for workflow '${workflow_id}'.`);
      return;
    }
    const run = runs[0];

    if (run.status !== 'completed') { // completed, in_progress, queued
      core.setFailed(`Workflow '${workflow_id}' has not completed yet (${run.status}).`);
    } else if (run.conclusion !== 'success') { // cancelled, success, failure
      core.setFailed(`Workflow '${workflow_id}' has not completed successfully (${run.conclusion}).`);
    }
    console.log(`Workflow '${workflow_id}' has completed successfully.`);
  } catch (error) {
    console.error(error);
    core.setFailed('An error occurred.');
  }
})();
