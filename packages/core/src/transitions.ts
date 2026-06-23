import type { TransitionConfig, TransitionName } from "./types";
import { validateNonNegativeInteger } from "./validation";

const DEFAULT_TRANSITION_DURATION_IN_FRAMES = 15;
const transitionNames = new Set<TransitionName>([
  "none",
  "fade",
  "slideLeft",
  "slideRight",
  "slideUp",
  "slideDown",
  "zoomIn",
  "zoomOut",
  "wipeLeft",
]);

export function resolveTransitionDuration(transition: TransitionConfig): number {
  if (transition.kind === "none") {
    return 0;
  }

  return transition.durationInFrames ?? DEFAULT_TRANSITION_DURATION_IN_FRAMES;
}

export function normalizeTransition(transition: TransitionConfig | undefined): Required<TransitionConfig> {
  if (!transition) {
    return { durationInFrames: 0, kind: "none" };
  }
  if (!transitionNames.has(transition.kind)) {
    throw new Error(`Stagecut transition kind "${transition.kind}" is not supported.`);
  }

  const durationInFrames = resolveTransitionDuration(transition);
  validateNonNegativeInteger("Stagecut transition durationInFrames", durationInFrames);

  return {
    durationInFrames,
    kind: transition.kind,
  };
}

export function progressForRange(offset: number, durationInFrames: number): number {
  if (durationInFrames <= 1) {
    return 1;
  }

  return Math.min(1, Math.max(0, offset / durationInFrames));
}
