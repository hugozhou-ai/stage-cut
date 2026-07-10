import type { JsonObject, StagecutProjectDefinition } from "@stagecut/core";
import type { ComponentType } from "react";

export interface FrameRenderContext {
  fps: number;
  globalFrame: number;
  layerId: string;
  localFrame: number;
  progress: number;
  sceneId: string;
}

export interface SurfaceComponentProps<TInputProps extends JsonObject = JsonObject> {
  context: FrameRenderContext;
  input: Readonly<TInputProps>;
}

export type SurfaceComponent<TInputProps extends JsonObject = JsonObject> = ComponentType<
  SurfaceComponentProps<TInputProps>
>;

export type SurfaceComponentMap = Readonly<Record<string, unknown>>;

type ProjectLayer<TProject extends StagecutProjectDefinition> =
  TProject["videos"][number]["scenes"][number]["layers"][number];

type InputForLayer<TLayer> = TLayer extends { inputProps: infer TInput }
  ? TInput extends JsonObject
    ? TInput
    : JsonObject
  : JsonObject;

type InputForSurface<TProject extends StagecutProjectDefinition, TSurfaceId extends string> = InputForLayer<
  Extract<ProjectLayer<TProject>, { surfaceId: TSurfaceId }>
>;

export type SurfaceRegistryForProject<TProject extends StagecutProjectDefinition> = {
  readonly [TSurfaceId in TProject["surfaces"][number]["id"]]: SurfaceComponent<InputForSurface<TProject, TSurfaceId>>;
};

export interface TransitionStyleContext {
  direction: "enter" | "exit";
  progress: number;
  sceneId: string;
}

export type StagecutPlayerStatus = "idle" | "paused" | "playing" | "ended" | "buffering" | "error";

export interface StagecutPlayerState {
  activeSceneId: string | null;
  currentFrame: number;
  durationInFrames: number;
  isReady: boolean;
  lastError: string | null;
  status: StagecutPlayerStatus;
}

export type StagecutPlayerPlaybackState = Pick<
  StagecutPlayerState,
  "durationInFrames" | "isReady" | "lastError" | "status"
>;

export type StagecutPlayerStateListener = () => void;
