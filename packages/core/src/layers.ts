import type { LayerDefinition } from "./types";
import { StagecutValidationError } from "./validation";

/** Half-open range in the owner's clock. Never silently clamp invalid edits. */
export function resolveLayerRange(layer: LayerDefinition, ownerDuration: number, path = "$.layer") {
  const startFrame = layer.startFrame ?? 0;
  const durationInFrames = layer.durationInFrames ?? ownerDuration - startFrame;
  if (
    !Number.isSafeInteger(startFrame) ||
    startFrame < 0 ||
    !Number.isSafeInteger(durationInFrames) ||
    durationInFrames <= 0 ||
    startFrame >= ownerDuration ||
    durationInFrames > ownerDuration - startFrame
  ) {
    throw new StagecutValidationError([
      { code: "layer_out_of_range", message: "layer must have a positive range within its owner", path },
    ]);
  }
  return { durationInFrames, endFrame: startFrame + durationInFrames, startFrame };
}
