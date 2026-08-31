const { randomBetween } = require("./utils");

// Decide how many commits happen on a given date based on the schedule.
// date = Date object; schedule is one of: dense | sparse | weekday | realistic.
function commitsForDay(date, schedule, min, max) {
  const dow = date.getDay(); // 0 = Sunday ... 6 = Saturday

  if (schedule === "sparse") {
    // Only commit on ~65% of days
    if (Math.random() < 0.35) return 0;
    return randomBetween(min, max);
  }

  if (schedule === "weekday") {
    // No commits on weekends
    if (dow === 0 || dow === 6) return 0;
    return randomBetween(min, max);
  }

  if (schedule === "realistic") {
    // Heavy weekdays, light weekends, occasional skips
    const weekend = dow === 0 || dow === 6;
    if (Math.random() < (weekend ? 0.65 : 0.1)) return 0;
    if (weekend) return randomBetween(1, 2);
    return randomBetween(min, Math.min(max, 4));
  }

  // default / "dense": commit every day
  return randomBetween(min, max);
}

module.exports = { commitsForDay };
