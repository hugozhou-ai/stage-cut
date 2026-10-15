import { copyFileSync } from "node:fs";

copyFileSync("src/index.d.ts", "dist/index.d.ts");
copyFileSync("src/index.d.ts", "dist/index.d.cts");
