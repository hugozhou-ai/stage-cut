import type { PlayerVideo } from "@stagecut/core";
import type { SyntheticEvent } from "react";
import type {
  AttachablePlayer,
  StagecutPlayerPlaybackState,
  StagecutPlayerState,
  StagecutPlayerStateListener,
} from "./types";

function createInitialState(video: PlayerVideo): StagecutPlayerState {
  return {
    activeFrameId: video.getActiveFrameId(0),
    currentFrame: 0,
    durationInFrames: video.durationInFrames,
    isReady: false,
    lastError: null,
    status: video.playback.defaultStatus === "playing" ? "playing" : "paused",
  };
}

export class StagecutPlayerService {
  private readonly listeners = new Set<StagecutPlayerStateListener>();
  private readonly playbackListeners = new Set<StagecutPlayerStateListener>();
  private player: AttachablePlayer | null = null;
  readonly dataStore: StagecutPlayerState;
  readonly video: PlayerVideo;

  constructor(video: PlayerVideo) {
    this.video = video;
    this.dataStore = createInitialState(video);
  }

  attachPlayer(player: AttachablePlayer): void {
    this.player = player;
    this.updateState({
      currentFrame: player.getCurrentFrame(),
      isReady: true,
      status: player.isPlaying() ? "playing" : this.dataStore.status,
    });
  }

  detachPlayer(player: AttachablePlayer): void {
    if (this.player === player) {
      this.player = null;
      this.updateState({ isReady: false });
    }
  }

  getCurrentFrame(): number {
    return this.player?.getCurrentFrame() ?? this.dataStore.currentFrame;
  }

  getPlaybackState(): StagecutPlayerPlaybackState {
    return {
      durationInFrames: this.dataStore.durationInFrames,
      isReady: this.dataStore.isReady,
      lastError: this.dataStore.lastError,
      status: this.dataStore.status,
    };
  }

  getState(): StagecutPlayerState {
    return { ...this.dataStore };
  }

  markBuffering(): void {
    this.updateState({ status: "buffering" });
  }

  markEnded(): void {
    this.updateState({ status: "ended" });
  }

  markError(error: Error): void {
    console.error("[stagecut-player]", JSON.stringify({ error: error.message, videoId: this.video.id }));
    this.updateState({
      lastError: error.message,
      status: "error",
    });
  }

  markPaused(): void {
    this.updateState({ status: "paused" });
  }

  markPlaying(): void {
    this.updateState({
      lastError: null,
      status: "playing",
    });
  }

  markResumed(): void {
    this.updateState({
      lastError: null,
      status: this.player?.isPlaying() ? "playing" : "paused",
    });
  }

  pause(): void {
    this.player?.pause();
  }

  play(event?: SyntheticEvent): void {
    if (this.dataStore.status === "ended" || this.dataStore.currentFrame >= this.video.durationInFrames - 1) {
      this.seekToFrame(0);
    }

    this.player?.play(event);
  }

  seekToFrame(frame: number): void {
    if (!Number.isInteger(frame) || frame < 0 || frame >= this.video.durationInFrames) {
      throw new Error(`StagecutPlayerService seekToFrame received an invalid frame: ${frame}.`);
    }

    this.player?.seekTo(frame);
    this.setCurrentFrame(frame);
  }

  setCurrentFrame(frame: number): void {
    const currentFrame = Math.max(0, Math.min(frame, this.video.durationInFrames - 1));
    this.updateState({
      activeFrameId: this.video.getActiveFrameId(currentFrame),
      currentFrame,
    });
  }

  subscribe(listener: StagecutPlayerStateListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribePlayback(listener: StagecutPlayerStateListener): () => void {
    this.playbackListeners.add(listener);

    return () => {
      this.playbackListeners.delete(listener);
    };
  }

  toggle(event?: SyntheticEvent): void {
    this.player?.toggle(event);
  }

  private updateState(nextState: Partial<StagecutPlayerState>): void {
    const shouldNotifyPlayback =
      (nextState.durationInFrames !== undefined && nextState.durationInFrames !== this.dataStore.durationInFrames) ||
      (nextState.isReady !== undefined && nextState.isReady !== this.dataStore.isReady) ||
      (nextState.lastError !== undefined && nextState.lastError !== this.dataStore.lastError) ||
      (nextState.status !== undefined && nextState.status !== this.dataStore.status);

    Object.assign(this.dataStore, nextState);
    for (const listener of this.listeners) {
      listener();
    }
    if (!shouldNotifyPlayback) {
      return;
    }

    for (const listener of this.playbackListeners) {
      listener();
    }
  }
}

export function createStagecutPlayerController(video: PlayerVideo): StagecutPlayerService {
  return new StagecutPlayerService(video);
}
