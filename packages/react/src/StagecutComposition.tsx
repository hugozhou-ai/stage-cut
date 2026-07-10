import { type CompiledScene, type CompiledStagecutVideo, progressForRange } from "@stagecut/core";
import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { resolveTransitionStyle } from "./transitionStyles";
import type { FrameRenderContext, SurfaceComponent, SurfaceComponentMap } from "./types";

export interface StagecutCompositionProps {
  surfaces: SurfaceComponentMap;
  video: CompiledStagecutVideo;
}

function createSceneStyle(item: CompiledScene, absoluteFrame: number, clipContent: boolean): CSSProperties {
  const localFrame = absoluteFrame - item.startFrame;
  const baseStyle: CSSProperties = {
    overflow: clipContent ? "hidden" : "visible",
    pointerEvents: "none",
  };
  if (item.inTransition && localFrame < item.inTransition.durationInFrames) {
    return {
      ...baseStyle,
      ...resolveTransitionStyle(item.inTransition.transition, {
        direction: "enter",
        progress: progressForRange(localFrame, item.inTransition.durationInFrames),
        sceneId: item.scene.id,
      }),
    };
  }
  if (item.outTransition && localFrame >= item.scene.durationInFrames - item.outTransition.durationInFrames) {
    return {
      ...baseStyle,
      ...resolveTransitionStyle(item.outTransition.transition, {
        direction: "exit",
        progress: progressForRange(
          localFrame - (item.scene.durationInFrames - item.outTransition.durationInFrames),
          item.outTransition.durationInFrames,
        ),
        sceneId: item.scene.id,
      }),
    };
  }
  return baseStyle;
}

function Scene({
  absoluteFrame,
  item,
  surfaces,
  video,
}: StagecutCompositionProps & { absoluteFrame: number; item: CompiledScene }) {
  const localFrame = absoluteFrame - item.startFrame;
  return (
    <AbsoluteFill style={createSceneStyle(item, absoluteFrame, video.clipContent)}>
      {item.scene.layers.map((layer) => {
        const Surface = surfaces[layer.surfaceId] as SurfaceComponent | undefined;
        if (!Surface) {
          throw new Error(
            `Stagecut scene references an unregistered surface: ${JSON.stringify({ sceneId: item.scene.id, surfaceId: layer.surfaceId })}`,
          );
        }
        const context: FrameRenderContext = {
          fps: video.fps,
          globalFrame: absoluteFrame,
          layerId: layer.id,
          localFrame,
          progress: progressForRange(localFrame, item.scene.durationInFrames),
          sceneId: item.scene.id,
        };
        const input = layer.inputProps ?? {};
        return (
          <AbsoluteFill key={layer.id} style={{ pointerEvents: "none" }}>
            <Surface context={context} input={input} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}

export function StagecutComposition({ surfaces, video }: StagecutCompositionProps) {
  const absoluteFrame = useCurrentFrame();
  const renderWindow = video.getRenderWindow(absoluteFrame);
  return (
    <AbsoluteFill
      style={{
        background: video.stage.background ?? "transparent",
        overflow: video.clipContent ? "hidden" : "visible",
        pointerEvents: "none",
      }}
    >
      {renderWindow.map((item) => (
        <Scene absoluteFrame={absoluteFrame} item={item} key={item.scene.id} surfaces={surfaces} video={video} />
      ))}
    </AbsoluteFill>
  );
}
