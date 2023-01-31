import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(): Promise<void> {
  try {
    const octokit = github.getOctokit(core.getInput("github-token"));
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const workflowListInputs = {
      owner,
      repo,
      workflow_id: core.getInput("workflow-id"),
      status: "success",
      branch: core.getInput("branch"),
      event: core.getInput("event") ?? undefined,
    } as const;
    core.debug(`Workflow list inputs: ${JSON.stringify(workflowListInputs)}`);
    const workflowRuns = await octokit.rest.actions.listWorkflowRuns(
      workflowListInputs
    );
    core.debug(`Workflow runs: ${JSON.stringify(workflowRuns.data)}`);

    if (workflowRuns.data.total_count === 0) {
      core.warning(
        "No successful workflow runs found. Defaulting to an early commit."
      );
      // Get the earliest commit in the repo
      // TODO: This will only work for fairly new repos
      const commits = await octokit.rest.repos.listCommits({
        owner,
        repo,
      });
      core.debug(`Commits: ${JSON.stringify(commits.data)}`);
      const lastCommit = commits.data[commits.data.length - 1];
      return exit(lastCommit.sha);
    }

    const lastSuccessCommitHash = workflowRuns.data.workflow_runs[0].head_sha;
    return exit(lastSuccessCommitHash);
  } catch (e) {
    if (e instanceof Error) {
      core.setFailed(e.message);
    } else {
      core.setFailed(`Unknown error occurred: ${e}`);
    }
  }
}

function exit(commitSha: string): void {
  core.setOutput("commit-sha", commitSha);
  core.info(`Commit SHA: ${commitSha}`);
  process.exit(0);
}

run();
