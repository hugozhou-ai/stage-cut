export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type TransitionName =
  | "none"
  | "fade"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  | "zoomIn"
  | "zoomOut"
  | "wipeLeft";

export interface TransitionConfig {
  durationInFrames?: number;
  kind: TransitionName;
}

export interface SurfaceDefinition<TMetadata extends JsonObject = JsonObject> {
  description?: string;
  id: string;
  metadata?: TMetadata;
  name: string;
}

export interface StageDefinition<TMetadata extends JsonObject = JsonObject> {
  background?: string;
  height: number;
  id: string;
  metadata?: TMetadata;
  name: string;
  width: number;
}

export interface LayerDefinition<
  TInputProps extends JsonObject = JsonObject,
  TMetadata extends JsonObject = JsonObject,
> {
  id: string;
  inputProps?: TInputProps;
  metadata?: TMetadata;
  surfaceId: string;
}

export interface SceneDefinition<TMetadata extends JsonObject = JsonObject> {
  durationInFrames: number;
  id: string;
  layers: readonly LayerDefinition[];
  metadata?: TMetadata;
  name?: string;
  transitionToNext?: TransitionConfig;
}

export interface PlaybackOptions {
  autoPlay?: boolean;
  controls?: boolean;
  defaultStatus?: "paused" | "playing";
  loop?: boolean;
}

export interface VideoDefinition<TMetadata extends JsonObject = JsonObject> {
  clipContent?: boolean;
  defaultTransition?: TransitionConfig;
  description?: string;
  fps: number;
  id: string;
  metadata?: TMetadata;
  name: string;
  playback?: PlaybackOptions;
  scenes: readonly SceneDefinition[];
  stageId: string;
}

export interface SceneTransitionEdge {
  durationInFrames: number;
  fromSceneId: string;
  toSceneId: string;
  transition: Required<TransitionConfig>;
}

export interface CompiledScene {
  endFrame: number;
  inTransition?: SceneTransitionEdge;
  index: number;
  outTransition?: SceneTransitionEdge;
  scene: Readonly<SceneDefinition>;
  startFrame: number;
}

export interface CompiledTimeline {
  durationInFrames: number;
  edges: readonly SceneTransitionEdge[];
  scenes: readonly CompiledScene[];
}

export interface StagecutProjectDefinition<TMetadata extends JsonObject = JsonObject> {
  description?: string;
  id: string;
  metadata?: TMetadata;
  name: string;
  schemaVersion: 1;
  stages: readonly StageDefinition[];
  surfaces: readonly SurfaceDefinition[];
  videos: readonly VideoDefinition[];
}

export interface CompiledStagecutVideo<TMetadata extends JsonObject = JsonObject> {
  readonly clipContent: boolean;
  readonly defaultTransition: Required<TransitionConfig>;
  readonly description?: string;
  readonly fps: number;
  readonly id: string;
  readonly metadata?: Readonly<TMetadata>;
  readonly name: string;
  readonly playback: Required<PlaybackOptions>;
  readonly projectId: string;
  readonly stage: Readonly<StageDefinition>;
  readonly timeline: CompiledTimeline;
  readonly video: Readonly<VideoDefinition<TMetadata>>;
  getActiveSceneIndex(frame: number): number;
  getRenderWindow(frame: number): readonly CompiledScene[];
}

export interface StagecutValidationIssue {
  code: string;
  message: string;
  path: string;
}

export type StagecutParseResult =
  | { data: StagecutProjectDefinition; success: true }
  | { error: import("./validation").StagecutValidationError; success: false };
