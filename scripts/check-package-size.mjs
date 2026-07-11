import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const LOG_PREFIX = "[stagecut:size-check]";
const budgets = [
  { budget: 10 * 1024, packageName: "@stagecut/core", path: "packages/core/dist/index.js" },
  { budget: 20 * 1024, packageName: "@stagecut/react", path: "packages/react/dist/index.js" },
  { budget: 35 * 1024, packageName: "@stagecut/devtools", path: "packages/devtools/dist/index.js" },
];

let failed = false;
for (const entry of budgets) {
  const bytes = gzipSync(await readFile(entry.path)).byteLength;
  const result = { budgetBytes: entry.budget, bytes, packageName: entry.packageName };
  if (bytes > entry.budget) {
    failed = true;
    console.error(`${LOG_PREFIX} ${JSON.stringify({ event: "budget-exceeded", ...result })}`);
  } else {
    console.log(`${LOG_PREFIX} ${JSON.stringify({ event: "within-budget", ...result })}`);
  }
}
if (failed) process.exit(1);
