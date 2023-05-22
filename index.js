const core = require('@actions/core');
const {context} = require('@actions/github');
const {OctokitlistForRef} = require("@octokit/rest");

const STATUS_IN_PROGRESS = 'in_progress';
const STATUS_NO_WORK = 'no_work';
const STATUS_SUCCESS = 'success';
const STATUS_ERROR = 'error';

try {
    // const ref = core.getInput('ref', {required: false}) || context.sha;
    // const token = core.getInput('repo-token');
    // const workflow = core.getInput('workflow');
    // const job = core.getInput('workflow', {required: false}) || null;
    const ref = "88b51c48aadccc27b9ee57ce329503d5af26e733";
    const token = "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";
    const workflow = "main.yml"
    const job = "test"

    const octokit = new Octokit({auth: token});
    const {owner, repo} = context.repo;

    const queryCheckWorkflows = async function () {
        const {data: response} = await octokit.checks.listForRef({owner, repo, ref});
        if (response.total_count === 1) {
            return [STATUS_NO_WORK, null];
        }
        let status = STATUS_SUCCESS;
        let jobName = null;
        try {
            response.check_runs.forEach(checkRun => {
                if (checkRun.name !== context.job) {
                    if (checkRun.status === 'in_progress' || checkRun.status === 'queued') {
                        jobName = checkRun.name;
                        status = STATUS_IN_PROGRESS;
                        throw BreakException;
                    }
                    if (['failure', 'cancelled', 'timed_out'].includes(checkRun.conclusion)) {
                        jobName = checkRun.name;
                        status = STATUS_ERROR;
                        throw BreakException;
                    }
                }
            })
        } catch (e) {
            if (e !== BreakException) throw e;
        }

        return [status, jobName];
    };

    (async () => {
        try {
            [result, jobName] = await queryCheckWorkflows();

            console.log(result, jobName);

            return;

            // if (result === STATUS_NO_WORK) {
            //     if (breakIfNoWork === true) {
            //         core.setFailed(`There aren't checks for this ref, exiting...`);
            //     } else {
            //         console.log(`There aren't checks for this ref, pass...`)
            //     }
            //     break;
            // } else if (result === STATUS_ERROR) {
            //     core.setFailed(`Workflow ${jobName} ended with error, exiting...`);
            //     break;
            // } else if (result === STATUS_SUCCESS) {
            //     break;
            // }
            // if (executedTime > waitMax) {
            //     core.setFailed('Time exceed max limit (' + waitMax + '), stopping...');
            //     break;
            // }
            // console.log(`Workflow ${jobName} still in progress (${executedTime}s.), will check for ${waitInterval} seconds...`);
            // await sleep(waitInterval);
            // executedTime += waitInterval;
        } catch (error) {
            core.setFailed(error.message);
        }
    })();
} catch (error) {
    core.setFailed(error.message);
}
