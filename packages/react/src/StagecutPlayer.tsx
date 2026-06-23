import type { PlayerRef } from "@remotion/player";
import { Player } from "@remotion/player";
import type { PlayerVideo } from "@stagecut/core";
import type { CSSProperties, Ref } from "react";
import { useEffect, useImperativeHandle, useRef, useSyncExternalStore } from "react";
import { useStagecutPlayerController } from "./hooks";
import { StagecutComposition } from "./StagecutComposition";
import type { StagecutPlayerService } from "./StagecutPlayerService";
import type { StagecutMountPolicy, SurfaceComponentMap } from "./types";

export interface StagecutPlayerProps {
  className?: string;
  controller?: StagecutPlayerService;
  controllerRef?: Ref<StagecutPlayerService>;
  controls?: boolean;
  mountPolicy?: StagecutMountPolicy;
  style?: CSSProperties;
  surfaces: SurfaceComponentMap;
  video: PlayerVideo;
}

function subscribeToClientReady(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const timeout = window.setTimeout(listener, 0);

  return () => {
    window.clearTimeout(timeout);
  };
}

function getClientReadySnapshot(): boolean {
  return typeof window !== "undefined";
}

function getServerClientReadySnapshot(): boolean {
  return false;
}

function useClientReady(): boolean {
  return useSyncExternalStore(subscribeToClientReady, getClientReadySnapshot, getServerClientReadySnapshot);
}

export function StagecutPlayer({
  className,
  controller: externalController,
  controllerRef,
  controls,
  mountPolicy = "auto",
  style,
  surfaces,
  video,
}: StagecutPlayerProps) {
  const isClientReady = useClientReady();
  const playerRef = useRef<PlayerRef>(null);
  const fallbackController = useStagecutPlayerController(video);
  const controller = externalController ?? fallbackController;

  if (controller.video !== video) {
    throw new Error(
      `StagecutPlayer controller video "${controller.video.id}" does not match prop video "${video.id}".`,
    );
  }

  useImperativeHandle(controllerRef, () => controller, [controller]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isClientReady || mountPolicy === "placeholder") {
      return undefined;
    }

    controller.attachPlayer(player);

    const onPlay = () => controller.markPlaying();
    const onPause = () => controller.markPaused();
    const onEnded = () => controller.markEnded();
    const onWaiting = () => controller.markBuffering();
    const onResume = () => controller.markResumed();
    const onError = (event: { detail: { error: Error } }) => controller.markError(event.detail.error);
    const onFrameUpdate = (event: { detail: { frame: number } }) => controller.setCurrentFrame(event.detail.frame);

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);
    player.addEventListener("waiting", onWaiting);
    player.addEventListener("resume", onResume);
    player.addEventListener("error", onError);
    player.addEventListener("frameupdate", onFrameUpdate);
    player.addEventListener("timeupdate", onFrameUpdate);
    player.addEventListener("seeked", onFrameUpdate);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("waiting", onWaiting);
      player.removeEventListener("resume", onResume);
      player.removeEventListener("error", onError);
      player.removeEventListener("frameupdate", onFrameUpdate);
      player.removeEventListener("timeupdate", onFrameUpdate);
      player.removeEventListener("seeked", onFrameUpdate);
      controller.detachPlayer(player);
    };
  }, [controller, isClientReady, mountPolicy]);

  if (!isClientReady || mountPolicy === "placeholder") {
    return (
      <div
        aria-hidden="true"
        className={className}
        data-stagecut-placeholder="true"
        style={{
          aspectRatio: `${video.width} / ${video.height}`,
          ...style,
        }}
      />
    );
  }

  return (
    <Player
      acknowledgeRemotionLicense
      autoPlay={video.playback.autoPlay}
      className={className}
      component={StagecutComposition}
      compositionHeight={video.height}
      compositionWidth={video.width}
      controls={controls ?? video.playback.controls}
      durationInFrames={video.durationInFrames}
      fps={video.fps}
      initiallyMuted
      inputProps={{ surfaces, video }}
      loop={video.playback.loop}
      moveToBeginningWhenEnded={false}
      numberOfSharedAudioTags={0}
      ref={playerRef}
      showVolumeControls={false}
      style={style}
    />
  );
}
