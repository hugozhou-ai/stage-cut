import type { TransitionConfig } from "@stagecut/core";
import type { CSSProperties } from "react";
import type { TransitionStyleContext } from "./types";

function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress));
}

function percent(value: number): string {
  return `${value.toFixed(4)}%`;
}

export function resolveTransitionStyle(
  transition: Required<TransitionConfig>,
  context: TransitionStyleContext,
): CSSProperties {
  const progress = clampProgress(context.progress);

  if (transition.kind === "none") {
    return {};
  }

  if (transition.kind === "fade") {
    return {
      opacity: context.direction === "enter" ? progress : 1 - progress,
    };
  }

  if (transition.kind === "slideLeft") {
    return {
      transform:
        context.direction === "enter"
          ? `translateX(${percent((1 - progress) * 100)})`
          : `translateX(-${percent(progress * 100)})`,
    };
  }

  if (transition.kind === "slideRight") {
    return {
      transform:
        context.direction === "enter"
          ? `translateX(-${percent((1 - progress) * 100)})`
          : `translateX(${percent(progress * 100)})`,
    };
  }

  if (transition.kind === "slideUp") {
    return {
      transform:
        context.direction === "enter"
          ? `translateY(${percent((1 - progress) * 100)})`
          : `translateY(-${percent(progress * 100)})`,
    };
  }

  if (transition.kind === "slideDown") {
    return {
      transform:
        context.direction === "enter"
          ? `translateY(-${percent((1 - progress) * 100)})`
          : `translateY(${percent(progress * 100)})`,
    };
  }

  if (transition.kind === "zoomIn") {
    return {
      opacity: context.direction === "enter" ? progress : 1 - progress,
      transform: context.direction === "enter" ? `scale(${0.96 + 0.04 * progress})` : `scale(${1 + 0.04 * progress})`,
    };
  }

  if (transition.kind === "zoomOut") {
    return {
      opacity: context.direction === "enter" ? progress : 1 - progress,
      transform: context.direction === "enter" ? `scale(${1.04 - 0.04 * progress})` : `scale(${1 - 0.04 * progress})`,
    };
  }

  return {
    clipPath:
      context.direction === "enter"
        ? `inset(0 0 0 ${percent((1 - progress) * 100)})`
        : `inset(0 ${percent(progress * 100)} 0 0)`,
  };
}
