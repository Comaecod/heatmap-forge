#!/usr/bin/env node

/**
 * Git Activity Heatmap Generator
 * Creates backdated commits on an EXISTING GitHub repo via the GitHub API.
 *
 * Configuration comes from a .env file in the project root. See .env.example.
 *
 * Behavior:
 *  - If the repo has no README.md, an initial commit creates one.
 *  - Each backdated commit toggles the README: it appends a temporary block of
 *    words, then removes it on the next commit. The content always returns to
 *    the original (or the initially-created) README by the final commit, so
 *    nothing is left corrupted.
 */

const config = require("./src/config");
const GitHubClient = require("./src/github");
const { randomTime, randomBetween, timezoneOffset } = require("./src/utils");
const { makeBloatBlock, generateCommitMessage, defaultReadme } = require("./src/content");
const { commitsForDay } = require("./src/scheduler");

(async () => {
  if (!config.token) {
    console.error(
      "No token provided. Set GITHUB_TOKEN (or TOKEN) in .env, or pass --token=xxx."
    );
    process.exit(1);
  }

  const client = new GitHubClient({
    token: config.token,
    repo: config.repo,
    authorName: config.authorName,
    authorEmail: config.authorEmail,
  });

  try {
    // Resolve branch (auto-detect default when BRANCH is main/master).
    let branch = config.branch;
    if (branch === "main" || branch === "master") {
      try {
        branch = await client.getDefaultBranch();
        console.log(`Default branch: ${branch}`);
      } catch {
        console.log(`Assuming branch: ${branch}`);
      }
    }

    // Resolve the current HEAD to build commits on top of.
    let headSha;
    try {
      headSha = await client.getHeadSha(branch);
    } catch {
      console.error(`Could not resolve branch "${branch}". Does the repo exist?`);
      process.exit(1);
    }

    // Fetch (or prepare) the README content and decide its baseline.
    const found = await client.getReadme(branch);
    let readmePath = "README.md";
    let baseContent;
    let readmeExists = !!found;

    if (found) {
      baseContent = found.content;
      readmePath = found.path;
      console.log(`README.md found (${found.size} bytes).`);
    } else {
      console.log("No README.md found. Committing an initial README.md first...");
      baseContent = defaultReadme(config.repo);
      headSha = await client.createReadmeCommit({
        content: baseContent,
        message: "Initial commit: add README.md",
        date: new Date().toISOString(),
        parentSha: headSha,
        readmePath,
        branch,
      });
    }

    const startDate = new Date(config.startDate + "T00:00:00");
    const endDate = new Date(config.endDate + "T23:59:59");
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Repo: ${config.repo}@${branch}`);
    console.log(`Date range: ${config.startDate} to ${config.endDate} (${totalDays} days)`);
    console.log(`Commits per day: ${config.commitsMin}-${config.commitsMax}`);
    console.log(`Schedule: ${config.schedule}`);
    console.log("---\n");

    // Toggle README between the baseline and an inflated version so every
    // commit differs but the final state returns to the original content.
    let totalCommits = 0;
    let inflated = false;
    const bloatBlock = makeBloatBlock();

    const nextContent = () => {
      if (inflated) {
        inflated = false;
        return baseContent;
      }
      inflated = true;
      return baseContent.replace(/\s*$/, "") + "\n" + bloatBlock;
    };

    for (let d = 0; d < totalDays; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);
      const dateStr = currentDate.toISOString().split("T")[0];

      const commitsToday = commitsForDay(
        currentDate,
        config.schedule,
        config.commitsMin,
        config.commitsMax
      );

      for (let c = 0; c < commitsToday; c++) {
        const fullDate = `${dateStr}T${randomTime()}${timezoneOffset()}`;

        headSha = await client.createReadmeCommit({
          content: nextContent(),
          message: generateCommitMessage(),
          date: fullDate,
          parentSha: headSha,
          readmePath,
          branch,
        });

        totalCommits++;
        process.stdout.write(
          `\r  [${dateStr}] Commit ${totalCommits} (${fullDate.slice(11)}) ` +
            `- [${inflated ? "inflated" : "original"}]`
        );
      }
    }

    // If an odd number of commits left the README inflated, commit once more to
    // restore the original content so the final state is pristine.
    if (inflated) {
      const lastDate = new Date(endDate);
      lastDate.setHours(randomBetween(8, 23), randomBetween(0, 59), randomBetween(0, 59));
      headSha = await client.createReadmeCommit({
        content: baseContent,
        message: "Restore readme",
        date: lastDate.toISOString(),
        parentSha: headSha,
        readmePath,
        branch,
      });
      totalCommits++;
    }

    const finalMatches = readmeExists
      ? "the original README (unchanged from before the run)"
      : "the initial README created by this run";
    console.log(`\n\nDone! Pushed ${totalCommits} backdated commits to ${config.repo}@${branch}.`);
    console.log(`Final README.md content restored to ${finalMatches}.`);
    console.log("Verify at: https://github.com/" + config.repo);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
