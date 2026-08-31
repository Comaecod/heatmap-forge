const { loadDotEnv, path } = require("./utils");

// Load .env from the project root (parent of src/) before reading env vars.
loadDotEnv(path.join(__dirname, "..", ".env"));

function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const required = ["REPO", "START_DATE", "END_DATE", "AUTHOR_NAME", "AUTHOR_EMAIL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      "Copy .env.example to .env and fill in the values."
  );
  process.exit(1);
}

const config = {
  token: process.env.GITHUB_TOKEN || process.env.TOKEN || "",
  repo: process.env.REPO,
  startDate: process.env.START_DATE,
  endDate: process.env.END_DATE,
  branch: process.env.BRANCH || "main",
  commitsMin: envNumber("COMMITS_PER_DAY_MIN", 1),
  commitsMax: envNumber("COMMITS_PER_DAY_MAX", 3),
  schedule: process.env.SCHEDULE || "dense",
  authorName: process.env.AUTHOR_NAME,
  authorEmail: process.env.AUTHOR_EMAIL,
};

module.exports = config;
