const { pick, randomBetween } = require("./utils");

// Temporary block appended to the README (invisible HTML comment) that later
// commits remove again. Keeps the file intact and renders nothing on GitHub.
const BLOAT_TOKENS = [
  "alpha", "beta", "draft", "in progress", "WIP", "refresh", "tweak", "notes",
  "changelog", "roadmap", "idea", "misc", "placeholder", "scratch", "draft",
  "update", "todo", "fixme", "scratchpad", "notes",
];

function makeBloatBlock() {
  return `\n\n<!-- temporary: ${pick(BLOAT_TOKENS)} ${pick(BLOAT_TOKENS)} ${String(
    randomBetween(100, 9999)
  )} -->`;
}

// Chosen commit messages. Add/remove pairs keep them plausible either direction.
const ADD_MESSAGES = [
  "Update README",
  "Add notes to readme",
  "Refresh documentation",
  "Update project notes",
  "Add changelog notes",
  "Update readme content",
];
const REMOVE_MESSAGES = [
  "Clean up readme",
  "Remove temporary notes",
  "Trim documentation",
  "Remove changelog noise",
  "Tidy readme",
  "Revert temporary changes",
];

function generateCommitMessage() {
  return pick(Math.random() < 0.5 ? ADD_MESSAGES : REMOVE_MESSAGES);
}

// Default README content used when the repo has none.
function defaultReadme(repo) {
  const name = repo.split("/")[1] || repo;
  return [
    `# ${name}`,
    "",
    "A new project.",
    "",
    "## Description",
    "",
    "This repository contains a project. More details coming soon.",
    "",
    "## Getting Started",
    "",
    "Clone the repository and follow the usage instructions.",
    "",
  ].join("\n");
}

module.exports = { makeBloatBlock, generateCommitMessage, defaultReadme };
