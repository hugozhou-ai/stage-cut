import { type JsonObject, type PlayerVideo, progressForRange, type TimelineItem } from "@stagecut/core";
import type { ComponentType, CSSProperties, ReactElement } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { resolveTransitionStyle } from "./transitionStyles";
import type { FrameRenderContext, ResolvedFrameRender, SurfaceComponentMap } from "./types";

export interface StagecutCompositionProps {
  renderMissingSurface?: (render: ResolvedFrameRender) => ReactElement | null;
  surfaces: SurfaceComponentMap;
  video: PlayerVideo;
}

function createFrameStyle(item: TimelineItem, video: PlayerVideo, absoluteFrame: number): CSSProperties {
  const frame = video.frames[item.index];
  const localFrame = absoluteFrame - item.startFrame;
  const baseStyle: CSSProperties = {
    background: "transparent",
    overflow: video.clipContent ? "hidden" : "visible",
    pointerEvents: "none",
  };

  if (item.inTransition && localFrame < item.inTransition.durationInFrames) {
    return {
      ...baseStyle,
      ...resolveTransitionStyle(item.inTransition.transition, {
        direction: "enter",
        frameId: item.frameId,
        progress: progressForRange(localFrame, item.inTransition.durationInFrames),
      }),
    };
  }

  if (frame && item.outTransition && localFrame >= frame.durationInFrames - item.outTransition.durationInFrames) {
    return {
      ...baseStyle,
      ...resolveTransitionStyle(item.outTransition.transition, {
        direction: "exit",
        frameId: item.frameId,
        progress: progressForRange(
          localFrame - (frame.durationInFrames - item.outTransition.durationInFrames),
          item.outTransition.durationInFrames,
        ),
      }),
    };
  }

  return baseStyle;
}

function DefaultMissingSurface({ render }: { render: ResolvedFrameRender }) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: "#1f2430",
        color: "#f8fafc",
        display: "flex",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        justifyContent: "center",
      }}
    >
      Missing surface: {render.surfaceId}
    </AbsoluteFill>
  );
}

function CompositionFrame({
  item,
  renderMissingSurface,
  surfaces,
  video,
}: {
  item: TimelineItem;
  renderMissingSurface?: (render: ResolvedFrameRender) => ReactElement | null;
  surfaces: SurfaceComponentMap;
  video: PlayerVideo;
}) {
  const sequenceFrame = useCurrentFrame();
  const frame = video.frames[item.index];
  if (!frame) {
    return null;
  }

  const absoluteFrame = item.startFrame + sequenceFrame;
  const context: FrameRenderContext = {
    absoluteFrame,
    frameId: item.frameId,
    isActive: video.getActiveFrameId(absoluteFrame) === item.frameId,
    localFrame: sequenceFrame,
    progress: progressForRange(sequenceFrame, frame.durationInFrames - 1),
  };
  const render: ResolvedFrameRender = {
    ...context,
    inputProps: frame.inputProps,
    style: createFrameStyle(item, video, absoluteFrame),
    surfaceId: frame.surfaceId,
  };
  const SurfaceComponent = surfaces[frame.surfaceId] as ComponentType<JsonObject & FrameRenderContext> | undefined;

  return (
    <AbsoluteFill style={render.style}>
      {SurfaceComponent ? (
        <SurfaceComponent {...frame.inputProps} {...context} />
      ) : (
        (renderMissingSurface?.(render) ?? <DefaultMissingSurface render={render} />)
      )}
    </AbsoluteFill>
  );
}

export function StagecutComposition({ renderMissingSurface, surfaces, video }: StagecutCompositionProps) {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {video.timeline.items.map((item) => {
        const frame = video.frames[item.index];
        if (!frame) {
          return null;
        }

        return (
          <Sequence durationInFrames={frame.durationInFrames} from={item.startFrame} key={item.frameId}>
            <CompositionFrame
              item={item}
              {...(renderMissingSurface ? { renderMissingSurface } : {})}
              surfaces={surfaces}
              video={video}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
