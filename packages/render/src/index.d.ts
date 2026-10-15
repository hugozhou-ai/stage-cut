export interface RenderOptions {
  entry: string;
  id: string;
  out?: string;
  frames?: readonly number[];
  /** Inclusive start and end, in absolute composition frames. */
  frameRange?: readonly [number, number];
  scale?: number;
  concurrency?: number;
  gl?: "angle" | "swangle" | "egl" | "swiftshader" | "vulkan" | "angle-egl";
  checkFrame?: number;
  stillsOnly?: boolean;
  onEvent?: (event: { event: string; [key: string]: unknown }) => void;
}
export interface RenderManifest {
  schemaVersion: 1;
  elapsedSeconds: number;
  entry: string;
  id: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  scale: number;
  frameRange?: readonly [number, number];
  stills: { frame: number; file: string; sha256: string }[];
  determinism: { frame: number; a: string; b: string; equal: boolean } | null;
  media: unknown;
  browserMessages: { type: string; text: string }[];
}
export declare function renderStagecutProject(options: RenderOptions): Promise<RenderManifest>;
export declare function inspectStagecutProject(
  options: Pick<RenderOptions, "entry" | "gl">,
): Promise<{ id: string; fps: number; width: number; height: number; durationInFrames: number }[]>;
