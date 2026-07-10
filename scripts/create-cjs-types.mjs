import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const LOG_PREFIX = "[stagecut:cjs-types]";
const root = process.argv[2];
if (!root) {
  throw new Error("Declaration output directory is required.");
}

let generated = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(path);
    } else if (extname(path) === ".ts" && path.endsWith(".d.ts")) {
      await writeFile(path.replace(/\.d\.ts$/, ".d.cts"), await readFile(path, "utf8"));
      generated += 1;
    }
  }
}

await visit(root);
console.log(`${LOG_PREFIX} ${JSON.stringify({ event: "generated", files: generated, root })}`);
