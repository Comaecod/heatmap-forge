const fs = require("fs");
const path = require("path");

// Tiny .env loader (no external dependency). Parses KEY=VALUE lines.
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomBetween(0, arr.length - 1)];
}

// Random time-of-day string HH:MM:SS within a working-hours window.
function randomTime() {
  const h = String(randomBetween(8, 23)).padStart(2, "0");
  const m = String(randomBetween(0, 59)).padStart(2, "0");
  const s = String(randomBetween(0, 59)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Local timezone offset as +HH:MM or -HH:MM (RFC 3339). Appended to commit
// date-times so GitHub accepts them (naive datetimes are rejected with 422).
function timezoneOffset() {
  const date = new Date();
  const off = -date.getTimezoneOffset(); // minutes east of UTC
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

module.exports = { loadDotEnv, randomBetween, pick, randomTime, timezoneOffset, path };
