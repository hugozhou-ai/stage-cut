import assert from "node:assert/strict";
import { test } from "node:test";
import { fromCli, validateFrameSelection, validateOptions } from "./options.mjs";

test("CLI rejects malformed selections instead of accepting empty frames as frame zero", () => {
  for (const frames of ["", "0,", "-1", "NaN"])
    assert.throws(() => fromCli({ entry: "render.tsx", id: "film", frames }));
  for (const range of ["10", "0-2-4", "-1-20"])
    assert.throws(() => fromCli({ entry: "render.tsx", id: "film", range }));
});
test("SDK rejects invalid numeric options and unsafe output IDs before starting a browser", () => {
  for (const override of [{ scale: 0 }, { scale: NaN }, { concurrency: 1.5 }, { gl: "unknown" }, { id: "../film" }]) {
    assert.throws(() => validateOptions({ entry: "render.tsx", id: "film", ...override }));
  }
});
test("selection validates exact duration boundaries and deduplicates frames without changing requested order", () => {
  assert.deepEqual(validateFrameSelection({ frames: [9, 0, 9], frameRange: [0, 9], checkFrame: 0 }, 10), {
    frames: [9, 0],
    frameRange: [0, 9],
    checkFrame: 0,
  });
  for (const selection of [{ frames: [10] }, { frames: [0.5] }, { frameRange: [9, 0] }, { checkFrame: -1 }]) {
    assert.throws(() => validateFrameSelection(selection, 10));
  }
});
