import { execFileSync } from "node:child_process";

const LOG_PREFIX = "[stagecut:commitlint]";
const range = process.argv[2] || "HEAD~20..HEAD";
let messages;
try {
  messages = execFileSync("git", ["log", "--format=%s", range], { encoding: "utf8" }).split("\n").filter(Boolean);
} catch (error) {
  console.error(`${LOG_PREFIX} ${JSON.stringify({ event: "git-log-error", message: error.message, range })}`);
  process.exit(1);
}

const pattern = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9._/-]+\))?!?: .+/;
const invalid = messages.filter(
  (message) => !message.startsWith("Merge ") && !message.startsWith("Revert ") && !pattern.test(message),
);
if (invalid.length > 0) {
  console.error(`${LOG_PREFIX} ${JSON.stringify({ event: "invalid-commits", invalid, range })}`);
  process.exit(1);
}
console.log(`${LOG_PREFIX} ${JSON.stringify({ event: "validated", range, total: messages.length })}`);
