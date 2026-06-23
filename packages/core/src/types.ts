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

export interface FrameTransitionOverrides {
  in?: TransitionConfig;
  out?: TransitionConfig;
}

export interface SurfaceDefinition<TMetadata extends JsonObject = JsonObject> {
  description?: string;
  id: string;
  metadata?: TMetadata;
  name: string;
  propsSchema?: JsonObject;
}

export interface StageDefinition<TMetadata extends JsonObject = JsonObject> {
  background?: string;
  height: number;
  id: string;
  metadata?: TMetadata;
  name: string;
  width: number;
}

export interface VideoFrameOptions<
  TInputProps extends JsonObject = JsonObject,
  TMetadata extends JsonObject = JsonObject,
> {
  durationInFrames: number;
  id: string;
  inputProps?: TInputProps;
  metadata?: TMetadata;
  surfaceId: string;
  transition?: FrameTransitionOverrides | TransitionConfig;
}

export interface VideoFrameDefinition<
  TInputProps extends JsonObject = JsonObject,
  TMetadata extends JsonObject = JsonObject,
> {
  durationInFrames: number;
  id: string;
  inputProps: TInputProps;
  metadata?: TMetadata;
  surfaceId: string;
  transition?: FrameTransitionOverrides;
}

export interface PlaybackOptions {
  autoPlay?: boolean;
  controls?: boolean;
  defaultStatus?: "paused" | "playing";
  loop?: boolean;
}

export interface PlayerVideoOptions<TMetadata extends JsonObject = JsonObject> {
  clipContent?: boolean;
  description?: string;
  fps: number;
  frames: VideoFrameDefinition[];
  height: number;
  id: string;
  metadata?: TMetadata;
  name: string;
  playback?: PlaybackOptions;
  stageId: string;
  transition?: TransitionConfig;
  width: number;
}

export interface TimelineEdge {
  durationInFrames: number;
  fromFrameId: string;
  toFrameId: string;
  transition: Required<TransitionConfig>;
}

export interface TimelineItem {
  endFrame: number;
  frameId: string;
  index: number;
  inTransition?: TimelineEdge;
  outTransition?: TimelineEdge;
  startFrame: number;
}

export interface ResolvedTimeline {
  durationInFrames: number;
  edges: TimelineEdge[];
  items: TimelineItem[];
}

export interface StagecutProjectOptions<TMetadata extends JsonObject = JsonObject> {
  description?: string;
  id: string;
  metadata?: TMetadata;
  name: string;
  stages: StageDefinition[];
  surfaces: SurfaceDefinition[];
  videos: PlayerVideoOptions[];
}

export interface StagecutProjectJson<TMetadata extends JsonObject = JsonObject>
  extends StagecutProjectOptions<TMetadata> {
  schemaVersion: 1;
}
