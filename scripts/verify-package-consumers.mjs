import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const LOG_PREFIX = "[stagecut:consumer-check]";
const root = resolve(import.meta.dirname, "..");
const artifacts = join(root, ".artifacts");

function run(command, args, cwd) {
  console.log(`${LOG_PREFIX} ${JSON.stringify({ args, command, cwd, event: "command-start" })}`);
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

async function packPackages() {
  await rm(artifacts, { force: true, recursive: true });
  await mkdir(artifacts, { recursive: true });
  run("pnpm", ["--filter", "@stagecut/core", "run", "build"], root);
  run("pnpm", ["--filter", "@stagecut/react", "run", "build"], root);
  run("pnpm", ["--filter", "@stagecut/core", "pack", "--pack-destination", artifacts], root);
  run("pnpm", ["--filter", "@stagecut/react", "pack", "--pack-destination", artifacts], root);
  const files = await readdir(artifacts);
  const core = files.find((file) => file.startsWith("stagecut-core-"));
  const react = files.find((file) => file.startsWith("stagecut-react-"));
  if (!core || !react) throw new Error(`Stagecut package tarballs were not created: ${JSON.stringify({ files })}`);
  return { core: join(artifacts, core), react: join(artifacts, react) };
}

const projectSource = `
import { compileStagecutVideo, defineStagecutProject } from "@stagecut/core";
import { defineSurfaceRegistry, StagecutPlayer } from "@stagecut/react";
import React from "react";
const project = defineStagecutProject({schemaVersion:1,id:"fixture",name:"Fixture",stages:[{id:"stage",name:"Stage",width:640,height:360}],surfaces:[{id:"title",name:"Title"}],videos:[{id:"video",name:"Video",stageId:"stage",fps:30,scenes:[{id:"scene",durationInFrames:30,layers:[{id:"title",surfaceId:"title",inputProps:{text:"Fixture"}}]}]}]});
const surfaces = defineSurfaceRegistry(project,{title:({input})=>React.createElement("h1",null,input.text)});
const video = compileStagecutVideo(project,"video");
export const player = React.createElement(StagecutPlayer,{surfaces,video});
`;

async function verifyVite(tarballs, reactVersion) {
  const directory = await mkdtemp(join(tmpdir(), `stagecut-react-${reactVersion}-`));
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        "@stagecut/core": `file:${tarballs.core}`,
        "@stagecut/react": `file:${tarballs.react}`,
        react: reactVersion,
        "react-dom": reactVersion,
      },
      devDependencies: { vite: "8.0.16" },
    }),
  );
  await writeFile(
    join(directory, "pnpm-workspace.yaml"),
    `packages: ["."]\noverrides:\n  '@stagecut/core': 'file:${tarballs.core}'\n`,
  );
  await writeFile(join(directory, "index.html"), '<div id="root"></div><script type="module" src="/src.jsx"></script>');
  await writeFile(
    join(directory, "src.jsx"),
    `${projectSource}\nimport {createRoot} from "react-dom/client";createRoot(document.getElementById("root")).render(player);`,
  );
  await writeFile(
    join(directory, "ssr.mjs"),
    `${projectSource}\nimport {renderToString} from "react-dom/server";const html=renderToString(player);if(!html.includes("data-stagecut-placeholder"))throw new Error("SSR placeholder missing");`,
  );
  run("pnpm", ["install", "--ignore-scripts"], directory);
  run("pnpm", ["exec", "vite", "build"], directory);
  run("node", ["ssr.mjs"], directory);
  console.log(`${LOG_PREFIX} ${JSON.stringify({ event: "vite-consumer-passed", reactVersion })}`);
}

async function verifyNext(tarballs) {
  const directory = await mkdtemp(join(tmpdir(), "stagecut-next-"));
  await mkdir(join(directory, "app"));
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({
      private: true,
      scripts: { build: "next build" },
      dependencies: {
        "@stagecut/core": `file:${tarballs.core}`,
        "@stagecut/react": `file:${tarballs.react}`,
        next: "16.2.10",
        react: "19.2.4",
        "react-dom": "19.2.4",
      },
    }),
  );
  await writeFile(
    join(directory, "pnpm-workspace.yaml"),
    `packages: ["."]\noverrides:\n  '@stagecut/core': 'file:${tarballs.core}'\n`,
  );
  await writeFile(
    join(directory, "app", "layout.jsx"),
    "export default function Layout({children}){return <html><body>{children}</body></html>}",
  );
  await writeFile(
    join(directory, "app", "page.jsx"),
    `"use client";\n${projectSource}\nexport default function Page(){return player}`,
  );
  run("pnpm", ["install", "--ignore-scripts"], directory);
  run("pnpm", ["build"], directory);
  const manifest = await readFile(join(directory, ".next", "build-manifest.json"), "utf8");
  if (!manifest.includes("pages")) throw new Error("Next build manifest is invalid.");
  console.log(`${LOG_PREFIX} ${JSON.stringify({ event: "next-consumer-passed", nextVersion: "16.2.10" })}`);
}

const tarballs = await packPackages();
await verifyVite(tarballs, "18.3.1");
await verifyVite(tarballs, "19.2.4");
await verifyNext(tarballs);
