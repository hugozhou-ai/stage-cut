import type { PlayerRef } from "@remotion/player";
import type { JsonObject } from "@stagecut/core";
import type { ComponentType, CSSProperties, SyntheticEvent } from "react";

export interface FrameRenderContext {
  absoluteFrame: number;
  frameId: string;
  isActive: boolean;
  localFrame: number;
  progress: number;
}

export type SurfaceComponent<TInputProps extends JsonObject = JsonObject> = ComponentType<
  TInputProps & FrameRenderContext
>;

export type SurfaceComponentMap = Record<string, SurfaceComponent<JsonObject>>;

export interface TransitionStyleContext {
  direction: "enter" | "exit";
  frameId: string;
  progress: number;
}

export interface StagecutPlayerState {
  activeFrameId: string | null;
  currentFrame: number;
  durationInFrames: number;
  isReady: boolean;
  lastError: string | null;
  status: "idle" | "paused" | "playing" | "ended" | "buffering" | "error";
}

export type StagecutPlayerPlaybackState = Pick<
  StagecutPlayerState,
  "durationInFrames" | "isReady" | "lastError" | "status"
>;

export type StagecutPlayerStateListener = () => void;

export interface AttachablePlayer {
  addEventListener: PlayerRef["addEventListener"];
  getCurrentFrame: PlayerRef["getCurrentFrame"];
  isPlaying: PlayerRef["isPlaying"];
  pause: PlayerRef["pause"];
  play: (event?: SyntheticEvent) => void;
  removeEventListener: PlayerRef["removeEventListener"];
  seekTo: PlayerRef["seekTo"];
  toggle: (event?: SyntheticEvent) => void;
}

export type StagecutMountPolicy = "auto" | "placeholder";

export interface ResolvedFrameRender {
  absoluteFrame: number;
  frameId: string;
  inputProps: JsonObject;
  isActive: boolean;
  localFrame: number;
  progress: number;
  style: CSSProperties;
  surfaceId: string;
}
