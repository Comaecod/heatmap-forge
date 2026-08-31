# heatmap-forge

Generates a full GitHub activity heatmap on an existing remote repository by creating
backdated commits that quietly toggle the `README.md` content. The README always ends up
back to normal, so nothing stays corrupted.

## How it works

- Reads all settings from a **`.env`** file in the project root (see `.env.example`).
- Uses the GitHub Contents + Git Data APIs to build a chain of commits directly on the
  remote repo — no local clone needed.
- Each backdated commit appends a temporary (invisible HTML-comment) block of words to
  the end of the README, then the **next** commit removes it. The file always returns to
  its original content by the final commit.
- If the repo has no `README.md`, an initial "add README.md" commit creates one, and the
  heatmap fills on top of it.
- Multiple `schedule` patterns control how many commits land on each day.

## Project structure

```
heatmap-forge/
├── index.js           # entry point / orchestrator
├── .env               # your config (git-ignored, stays local)
├── .env.example       # documented template for .env
├── src/
│   ├── config.js      # loads .env and validates required values
│   ├── content.js     # README content generation + commit messages
│   ├── github.js      # GitHub API client (Contents + Git Data endpoints)
│   ├── scheduler.js   # per-day commit frequency logic
│   └── utils.js       # random helpers + tiny .env loader
└── package.json
```

## Requirements

- Node.js (any modern version).
- A GitHub **Personal Access Token** with `repo` scope, or a fine-grained token with
  **Contents: Read & Write** on the target repo.
- The target repo must already exist on GitHub. `owner/repo` format.

## Setup

1. Install/ensure Node.js.
2. Copy the example env and open it:
   ```
   copy .env.example .env
   ```
3. Edit `.env` to fill in your values (see [Configuration](#configuration)).
4. Run:
   ```
   npm start
   ```

## Configuration

Everything is configured via **`.env`** at the project root. The `.env` file is what the
tool reads; a documented template lives in **`.env.example`**.

| Key | Required | Description |
| --- | -------- | --- |
| `GITHUB_TOKEN` | yes | GitHub PAT (or fine-grained token). See token notes below. |
| `REPO` | yes | Target repo in `owner/repo` format. Must already exist. |
| `START_DATE` | yes | First commit date, `YYYY-MM-DD`. Can be in the past. |
| `END_DATE` | yes | Last commit date, `YYYY-MM-DD`. Must be `>= START_DATE`. |
| `BRANCH` | no | Branch to commit on. `main`/`master` auto-detect the default branch. |
| `COMMITS_PER_DAY_MIN` | no | Minimum commits on an active day (default `1`). Must be `>= 1`. |
| `COMMITS_PER_DAY_MAX` | no | Maximum commits on an active day (default `3`). Must be `>= min`. |
| `SCHEDULE` | no | Frequency pattern (default `dense`). See table below. |
| `AUTHOR_NAME` | yes | Name stamped on each commit. |
| `AUTHOR_EMAIL` | yes | Email stamped on each commit. Should match your GitHub account email so squares count toward your heatmap. |

Numbers left empty fall back to sensible defaults; `BRANCH`/`SCHEDULE` default to
`main`/`dense`.

### `SCHEDULE` values

| Value | Behavior |
| ----- | -------- |
| `dense` (default) | Commit on **every** day, `min`..`max` commits each. Solid heatmap. |
| `sparse` | Commit on only ~65% of days. Lighter, patchier heatmap. |
| `weekday` | Commit on weekdays only (no weekends). Mon–Fri heatmap. |
| `realistic` | Heavy weekdays, light weekends, occasional skipped days. Most natural-looking. |

### Token

In `.env`, set either `GITHUB_TOKEN` (recommended) or `TOKEN`. If left blank, the tool
also checks the `GITHUB_TOKEN` environment variable, then the `--token=xxx` CLI argument.
Use a classic token with the `repo` scope, or a fine-grained token with
**Contents: Read & Write** on the target repo.

### Example `.env`

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
REPO=octocat/hello-world
START_DATE=2024-01-01
END_DATE=2024-12-31
BRANCH=main
COMMITS_PER_DAY_MIN=1
COMMITS_PER_DAY_MAX=3
SCHEDULE=realistic
AUTHOR_NAME=Octo Cat
AUTHOR_EMAIL=octocat@example.com
```

## Verification

After running, check the result:

- `https://github.com/<owner>/<repo>` — the contributions heatmap should be filled over
  your chosen date range.
- The commit history on GitHub should show author dates falling within range.

## Notes & caveats

- Commits are **detected on GitHub** based on the *author date*, which this tool sets to
  random times within each day — that's what makes past squares light up.
- The tool **cannot** backfill activity for dates before your GitHub account existed, and
  GitHub may flag the unusual all-at-once pattern. Use sensible schedules (`sparse`,
  `realistic`) for a less suspicious result.
- Committing to repositories you don't own or that prohibit this may violate their usage
  terms. Use only on repos you control.
- Add `.env` to `.gitignore` so your token is never committed.
