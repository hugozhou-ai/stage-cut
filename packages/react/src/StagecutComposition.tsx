import {
  type CompiledScene,
  type CompiledStagecutVideo,
  type LayerDefinition,
  progressForRange,
  resolveLayerRange,
} from "@stage-cut/core";
import type { CSSProperties } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { resolveTransitionStyle } from "./transitionStyles";
import type { FrameRenderContext, SurfaceComponent, SurfaceComponentMap } from "./types";

export interface StagecutCompositionProps {
  interactive?: boolean;
  surfaces: SurfaceComponentMap;
  video: CompiledStagecutVideo;
}

function createSceneStyle(
  item: CompiledScene,
  absoluteFrame: number,
  clipContent: boolean,
  interactive: boolean,
  isActive: boolean,
): CSSProperties {
  const localFrame = absoluteFrame - item.startFrame;
  const baseStyle: CSSProperties = {
    overflow: clipContent ? "hidden" : "visible",
    pointerEvents: interactive && isActive ? "auto" : "none",
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
  interactive = false,
  isActive,
  item,
  surfaces,
  video,
}: StagecutCompositionProps & { absoluteFrame: number; isActive: boolean; item: CompiledScene }) {
  const localFrame = absoluteFrame - item.startFrame;
  return (
    <AbsoluteFill style={createSceneStyle(item, absoluteFrame, video.clipContent, interactive, isActive)}>
      <Layers
        absoluteFrame={absoluteFrame}
        duration={item.scene.durationInFrames}
        interactive={interactive && isActive}
        layers={item.scene.layers}
        ownerFrame={localFrame}
        sceneId={item.scene.id}
        scope="scene"
        surfaces={surfaces}
        video={video}
      />
    </AbsoluteFill>
  );
}

function Layers({
  absoluteFrame,
  duration,
  interactive,
  layers,
  ownerFrame,
  sceneId,
  scope,
  surfaces,
  video,
}: {
  absoluteFrame: number;
  duration: number;
  interactive: boolean;
  layers: readonly LayerDefinition[];
  ownerFrame: number;
  sceneId: string;
  scope: FrameRenderContext["scope"];
  surfaces: SurfaceComponentMap;
  video: CompiledStagecutVideo;
}) {
  return (
    <>
      {layers.map((layer) => {
        const range = resolveLayerRange(layer, duration);
        if (ownerFrame < range.startFrame || ownerFrame >= range.endFrame) return null;
        const Surface = surfaces[layer.surfaceId] as SurfaceComponent | undefined;
        if (!Surface) {
          throw new Error(
            `Stagecut layer references an unregistered surface: ${JSON.stringify({ sceneId, scope, layerId: layer.id, surfaceId: layer.surfaceId })}`,
          );
        }
        const context: FrameRenderContext = {
          fps: video.fps,
          globalFrame: absoluteFrame,
          layerId: layer.id,
          localFrame: ownerFrame - range.startFrame,
          ownerFrame,
          durationInFrames: range.durationInFrames,
          progress: progressForRange(ownerFrame - range.startFrame, range.durationInFrames),
          sceneId,
          scope,
        };
        const input = layer.inputProps ?? {};
        return (
          <Sequence
            key={layer.id}
            from={absoluteFrame - ownerFrame + range.startFrame}
            durationInFrames={range.durationInFrames}
            layout="none"
          >
            <AbsoluteFill style={{ pointerEvents: interactive ? "auto" : "none" }}>
              <Surface context={context} input={input} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
}

export function StagecutComposition({ interactive = false, surfaces, video }: StagecutCompositionProps) {
  const absoluteFrame = useCurrentFrame();
  const renderWindow = video.getRenderWindow(absoluteFrame);
  const activeSceneIndex = video.getActiveSceneIndex(absoluteFrame);
  return (
    <AbsoluteFill
      style={{
        background: video.stage.background ?? "transparent",
        overflow: video.clipContent ? "hidden" : "visible",
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      <Layers
        absoluteFrame={absoluteFrame}
        duration={video.timeline.durationInFrames}
        interactive={interactive}
        layers={video.video.backgroundLayers ?? []}
        ownerFrame={absoluteFrame}
        sceneId=""
        scope="background"
        surfaces={surfaces}
        video={video}
      />
      {renderWindow.map((item) => (
        <Scene
          absoluteFrame={absoluteFrame}
          interactive={interactive}
          isActive={item.index === activeSceneIndex}
          item={item}
          key={item.scene.id}
          surfaces={surfaces}
          video={video}
        />
      ))}
      <Layers
        absoluteFrame={absoluteFrame}
        duration={video.timeline.durationInFrames}
        interactive={interactive}
        layers={video.video.overlayLayers ?? []}
        ownerFrame={absoluteFrame}
        sceneId=""
        scope="overlay"
        surfaces={surfaces}
        video={video}
      />
    </AbsoluteFill>
  );
}
