import type { PlayerRef } from "@remotion/player";
import { Player } from "@remotion/player";
import type { CompiledStagecutVideo } from "@stagecut/core";
import type { CSSProperties, Ref } from "react";
import { useEffect, useImperativeHandle, useMemo, useRef, useSyncExternalStore } from "react";
import { useStagecutPlayerController } from "./hooks";
import { assertVideoSurfaceRegistry } from "./registry";
import { StagecutComposition } from "./StagecutComposition";
import type { StagecutPlayerService } from "./StagecutPlayerService";
import type { SurfaceComponentMap } from "./types";

export interface StagecutPlayerProps {
  acknowledgeRemotionLicense?: boolean;
  ariaLabel?: string;
  className?: string;
  controller?: StagecutPlayerService;
  controllerRef?: Ref<StagecutPlayerService>;
  controls?: boolean;
  onError?: (error: Error) => void;
  style?: CSSProperties;
  surfaces: SurfaceComponentMap;
  video: CompiledStagecutVideo;
}

function subscribeToClientReady(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const timeout = window.setTimeout(listener, 0);
  return () => window.clearTimeout(timeout);
}

function useClientReady(): boolean {
  return useSyncExternalStore(
    subscribeToClientReady,
    () => typeof window !== "undefined",
    () => false,
  );
}

export function StagecutPlayer({
  acknowledgeRemotionLicense = false,
  ariaLabel = "Stagecut animation",
  className,
  controller: externalController,
  controllerRef,
  controls,
  onError,
  style,
  surfaces,
  video,
}: StagecutPlayerProps) {
  const isClientReady = useClientReady();
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const playerRef = useRef<PlayerRef>(null);
  const fallbackController = useStagecutPlayerController(video);
  const controller = externalController ?? fallbackController;
  const surfaceIds = useMemo(
    () => [...new Set(video.video.scenes.flatMap((scene) => scene.layers.map((layer) => layer.surfaceId)))],
    [video],
  );
  assertVideoSurfaceRegistry(surfaceIds, surfaces);

  if (controller.video !== video) {
    throw new Error(
      `Stagecut controller video does not match player video: ${JSON.stringify({ controllerVideoId: controller.video.id, playerVideoId: video.id })}`,
    );
  }
  useImperativeHandle(controllerRef, () => controller, [controller]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isClientReady) {
      return undefined;
    }
    controller.attachPlayer(player);
    const onPlay = () => controller.markPlaying();
    const onPause = () => controller.markPaused();
    const onEnded = () => controller.markEnded();
    const onWaiting = () => controller.markBuffering();
    const onResume = () => controller.markResumed();
    const onPlayerError = (event: { detail: { error: Error } }) => {
      controller.markError(event.detail.error);
      onErrorRef.current?.(event.detail.error);
    };
    const onFrameUpdate = (event: { detail: { frame: number } }) => controller.setCurrentFrame(event.detail.frame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);
    player.addEventListener("waiting", onWaiting);
    player.addEventListener("resume", onResume);
    player.addEventListener("error", onPlayerError);
    player.addEventListener("frameupdate", onFrameUpdate);
    player.addEventListener("timeupdate", onFrameUpdate);
    player.addEventListener("seeked", onFrameUpdate);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("waiting", onWaiting);
      player.removeEventListener("resume", onResume);
      player.removeEventListener("error", onPlayerError);
      player.removeEventListener("frameupdate", onFrameUpdate);
      player.removeEventListener("timeupdate", onFrameUpdate);
      player.removeEventListener("seeked", onFrameUpdate);
      controller.detachPlayer(player);
    };
  }, [controller, isClientReady]);

  const mergedStyle = { aspectRatio: `${video.stage.width} / ${video.stage.height}`, ...style };
  if (!isClientReady) {
    return (
      <div
        aria-label={ariaLabel}
        className={className}
        data-stagecut-placeholder="true"
        role="img"
        style={mergedStyle}
      />
    );
  }

  return (
    <Player
      acknowledgeRemotionLicense={acknowledgeRemotionLicense}
      aria-label={ariaLabel}
      autoPlay={video.playback.autoPlay}
      className={className}
      component={StagecutComposition}
      compositionHeight={video.stage.height}
      compositionWidth={video.stage.width}
      controls={controls ?? video.playback.controls}
      durationInFrames={video.timeline.durationInFrames}
      fps={video.fps}
      initiallyMuted
      inputProps={{ surfaces, video }}
      loop={video.playback.loop}
      moveToBeginningWhenEnded={false}
      numberOfSharedAudioTags={0}
      ref={playerRef}
      showVolumeControls={false}
      style={mergedStyle}
    />
  );
}
