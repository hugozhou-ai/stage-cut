import type { CompiledStagecutVideo } from "@stagecut/core";
import type { StagecutPlayerPlaybackState, StagecutPlayerState, StagecutPlayerStateListener } from "./types";

interface StagecutPlaybackAdapter {
  getCurrentFrame(): number;
  isPlaying(): boolean;
  pause(): void;
  play(): void;
  seekTo(frame: number): void;
}

function activeSceneId(video: CompiledStagecutVideo, frame: number): string | null {
  return video.timeline.scenes[video.getActiveSceneIndex(frame)]?.scene.id ?? null;
}

function createInitialState(video: CompiledStagecutVideo): StagecutPlayerState {
  return {
    activeSceneId: activeSceneId(video, 0),
    currentFrame: 0,
    durationInFrames: video.timeline.durationInFrames,
    isReady: false,
    lastError: null,
    status: "idle",
  };
}

export class StagecutPlayerService {
  private readonly listeners = new Set<StagecutPlayerStateListener>();
  private player: StagecutPlaybackAdapter | null = null;
  private readonly playbackListeners = new Set<StagecutPlayerStateListener>();
  private readonly state: StagecutPlayerState;
  readonly video: CompiledStagecutVideo;

  constructor(video: CompiledStagecutVideo) {
    this.video = video;
    this.state = createInitialState(video);
  }

  /** @internal Used by the Stagecut React adapter. */
  attachPlayer(player: StagecutPlaybackAdapter): void {
    const currentFrame = this.validateObservedFrame(player.getCurrentFrame());
    this.player = player;
    this.updateState({
      activeSceneId: activeSceneId(this.video, currentFrame),
      currentFrame,
      isReady: true,
      lastError: null,
      status: player.isPlaying() ? "playing" : "paused",
    });
  }

  /** @internal Used by the Stagecut React adapter. */
  detachPlayer(player: StagecutPlaybackAdapter): void {
    if (this.player !== player) {
      return;
    }
    this.player = null;
    this.updateState({ isReady: false, status: "idle" });
  }

  getCurrentFrame(): number {
    return this.state.currentFrame;
  }

  getPlaybackState(): StagecutPlayerPlaybackState {
    return {
      durationInFrames: this.state.durationInFrames,
      isReady: this.state.isReady,
      lastError: this.state.lastError,
      status: this.state.status,
    };
  }

  getState(): StagecutPlayerState {
    return { ...this.state };
  }

  /** @internal Used by the Stagecut React adapter. */
  markBuffering(): void {
    this.updateState({ status: "buffering" });
  }

  /** @internal Used by the Stagecut React adapter. */
  markEnded(): void {
    const currentFrame = this.video.timeline.durationInFrames - 1;
    this.updateState({
      activeSceneId: activeSceneId(this.video, currentFrame),
      currentFrame,
      status: "ended",
    });
  }

  /** @internal Used by the Stagecut React adapter. */
  markError(error: Error): void {
    this.updateState({ lastError: error.message, status: "error" });
  }

  /** @internal Used by the Stagecut React adapter. */
  markPaused(): void {
    if (this.state.status !== "ended") {
      this.updateState({ status: "paused" });
    }
  }

  /** @internal Used by the Stagecut React adapter. */
  markPlaying(): void {
    this.updateState({ lastError: null, status: "playing" });
  }

  /** @internal Used by the Stagecut React adapter. */
  markResumed(): void {
    this.updateState({
      lastError: null,
      status: this.player?.isPlaying() ? "playing" : "paused",
    });
  }

  pause(): void {
    this.player?.pause();
  }

  play(): void {
    if (this.state.status === "ended" || this.state.currentFrame >= this.video.timeline.durationInFrames - 1) {
      this.seekToFrame(0);
    }
    this.player?.play();
  }

  seekToFrame(frame: number): void {
    this.assertSeekFrame(frame);
    this.player?.seekTo(frame);
    this.updateState({
      activeSceneId: activeSceneId(this.video, frame),
      currentFrame: frame,
      ...(this.state.status === "ended" || this.state.status === "error"
        ? { lastError: null, status: "paused" as const }
        : {}),
    });
  }

  seekToSeconds(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new RangeError(`Stagecut seek time must be a non-negative finite number. Received ${seconds}.`);
    }
    this.seekToFrame(Math.min(Math.floor(seconds * this.video.fps), this.video.timeline.durationInFrames - 1));
  }

  /** @internal Used by the Stagecut React adapter. */
  setCurrentFrame(frame: number): void {
    const currentFrame = this.validateObservedFrame(frame);
    this.updateState({
      activeSceneId: activeSceneId(this.video, currentFrame),
      currentFrame,
      ...(this.state.status === "ended" && currentFrame < this.video.timeline.durationInFrames - 1
        ? { status: "paused" as const }
        : {}),
    });
  }

  stepByFrames(frameDelta: number): void {
    if (!Number.isInteger(frameDelta)) {
      throw new RangeError(`Stagecut frame delta must be an integer. Received ${frameDelta}.`);
    }
    const target = Math.max(
      0,
      Math.min(this.state.currentFrame + frameDelta, this.video.timeline.durationInFrames - 1),
    );
    this.seekToFrame(target);
  }

  subscribe(listener: StagecutPlayerStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribePlayback(listener: StagecutPlayerStateListener): () => void {
    this.playbackListeners.add(listener);
    return () => this.playbackListeners.delete(listener);
  }

  toggle(): void {
    if (this.player?.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  private assertSeekFrame(frame: number): void {
    if (!Number.isInteger(frame) || frame < 0 || frame >= this.video.timeline.durationInFrames) {
      throw new RangeError(
        `Stagecut seek frame must be an integer from 0 to ${this.video.timeline.durationInFrames - 1}. Received ${frame}.`,
      );
    }
  }

  private updateState(nextState: Partial<StagecutPlayerState>): void {
    const changedKeys = (Object.keys(nextState) as Array<keyof StagecutPlayerState>).filter(
      (key) => nextState[key] !== this.state[key],
    );
    if (changedKeys.length === 0) {
      return;
    }
    const playbackChanged = changedKeys.some((key) =>
      ["durationInFrames", "isReady", "lastError", "status"].includes(key),
    );
    Object.assign(this.state, nextState);
    for (const listener of this.listeners) {
      listener();
    }
    if (playbackChanged) {
      for (const listener of this.playbackListeners) {
        listener();
      }
    }
  }

  private validateObservedFrame(frame: number): number {
    if (!Number.isInteger(frame) || frame < 0 || frame >= this.video.timeline.durationInFrames) {
      throw new RangeError(
        `Stagecut observed an invalid player frame for video "${this.video.id}": ${JSON.stringify({ frame })}`,
      );
    }
    return frame;
  }
}

export function createStagecutPlayerController(video: CompiledStagecutVideo): StagecutPlayerService {
  return new StagecutPlayerService(video);
}
