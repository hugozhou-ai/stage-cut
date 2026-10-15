// Repository compatibility entry; implementation lives in the publishable render package.
process.argv.splice(2, 0, "render");
await import("../packages/render/src/cli.mjs");
