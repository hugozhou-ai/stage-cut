#!/usr/bin/env node
import { parseArgs } from "node:util";
import { inspectStagecutProject, renderStagecutProject } from "../dist/index.js";
import { fromCli } from "./options.mjs";

try {
  const command = process.argv[2];
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      entry: { type: "string" },
      id: { type: "string" },
      out: { type: "string" },
      frames: { type: "string" },
      range: { type: "string" },
      scale: { type: "string" },
      concurrency: { type: "string" },
      gl: { type: "string" },
      "check-frame": { type: "string" },
      "stills-only": { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  if (values.help || command === "--help" || !command) {
    console.log(
      "stagecut inspect --entry render.tsx\nstagecut render --entry render.tsx --id film [--out .artifacts/film] [--frames 0,120,240] [--range 0-239] [--scale 0.5] [--check-frame 120] [--stills-only] [--concurrency 2] [--gl angle]",
    );
  } else if (command === "inspect") {
    if (!values.entry) throw new Error("--entry is required");
    console.log(
      JSON.stringify(
        await inspectStagecutProject({ entry: values.entry, ...(values.gl ? { gl: values.gl } : {}) }),
        null,
        2,
      ),
    );
  } else if (command === "render") {
    await renderStagecutProject(fromCli(values));
  } else throw new Error(`Unknown command: ${command}`);
} catch (error) {
  console.error(
    `[stagecut-render] ${JSON.stringify({ event: "error", message: error instanceof Error ? error.message : String(error) })}`,
  );
  process.exitCode = 1;
}
