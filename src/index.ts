import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(): Promise<void> {
  try {
    const octokit = github.getOctokit(core.getInput("github_token"));
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const workflowRuns = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: core.getInput("workflow_id"),
      status: "success",
      branch: core.getInput("branch"),
      event: core.getInput("event") ?? "push",
    });

    if (workflowRuns.data.total_count === 0) {
      core.warning("No successful workflow runs found");
      // Get the earliest commit in the repo
      const commits = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 1,
      });
      core.setOutput("commit_hash", commits.data[0].sha);
      return;
    }

    const lastSuccessCommitHash = workflowRuns.data.workflow_runs[0].head_sha;
    core.setOutput("commit_hash", lastSuccessCommitHash);
  } catch (e) {
    if (e instanceof Error) {
      core.setFailed(e.message);
    } else {
      core.setFailed(`Unknown error occurred: ${e}`);
    }
  }
}

run();
