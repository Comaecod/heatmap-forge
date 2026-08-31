#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

// The `files` whitelist in package.json governs what gets published. This guard
// verifies that a leaked secret file could actually make it into the tarball.
const pkgPath = path.join(root, "package.json");
let allowList = [];
try {
  allowList = JSON.parse(fs.readFileSync(pkgPath, "utf8")).files || [];
} catch {
  /* ignore - files field governs by default */
}

// If there is no explicit allow-list, everything (except .npmignore terms) ships.
const usingAllowList = allowList.length > 0;

const forbidden = [".env", ".npmrc"];
const offenders = forbidden.filter((name) => fs.existsSync(path.join(root, name)));

const wouldShip = offenders.filter((name) => !usingAllowList || allowList.includes(name));

if (wouldShip.length > 0) {
  console.error(
    `\nRefusing to pack. These secret files would be published:\n` +
      wouldShip.map((o) => `  - ${o}`).join("\n") +
      `\nRemove them or exclude them before publishing.\n`
  );
  process.exit(1);
}
