import { normalizeTransition } from "./transitions";
import type {
  JsonObject,
  PlaybackOptions,
  PlayerVideoOptions,
  ResolvedTimeline,
  TimelineEdge,
  TimelineItem,
  TransitionConfig,
  VideoFrameDefinition,
} from "./types";
import { assertUniqueIds, normalizeId, validatePositiveInteger } from "./validation";

function resolveEdgeTransition(
  fromFrame: VideoFrameDefinition,
  toFrame: VideoFrameDefinition,
  defaultTransition: Required<TransitionConfig>,
): Required<TransitionConfig> {
  return normalizeTransition(fromFrame.transition?.out ?? toFrame.transition?.in ?? defaultTransition);
}

export class PlayerVideo<TMetadata extends JsonObject = JsonObject> {
  readonly clipContent: boolean;
  readonly description: string | undefined;
  readonly fps: number;
  readonly frames: VideoFrameDefinition[];
  readonly height: number;
  readonly id: string;
  readonly metadata: TMetadata | undefined;
  readonly name: string;
  readonly playback: Required<PlaybackOptions>;
  readonly stageId: string;
  readonly timeline: ResolvedTimeline;
  readonly transition: Required<TransitionConfig>;
  readonly width: number;

  constructor(options: PlayerVideoOptions<TMetadata>) {
    const id = normalizeId(options.id, "PlayerVideo");
    const stageId = normalizeId(options.stageId, `PlayerVideo "${id}" stage`);
    validatePositiveInteger(`PlayerVideo "${id}" width`, options.width);
    validatePositiveInteger(`PlayerVideo "${id}" height`, options.height);
    validatePositiveInteger(`PlayerVideo "${id}" fps`, options.fps);
    if (options.frames.length === 0) {
      throw new Error(`PlayerVideo "${id}" requires at least one frame.`);
    }

    assertUniqueIds(`PlayerVideo "${id}" frames`, options.frames);

    this.clipContent = options.clipContent ?? true;
    this.description = options.description;
    this.fps = options.fps;
    this.frames = options.frames.map((frame) => ({ ...frame, inputProps: { ...frame.inputProps } }));
    this.height = options.height;
    this.id = id;
    this.metadata = options.metadata;
    this.name = options.name;
    this.playback = {
      autoPlay: options.playback?.autoPlay ?? options.playback?.defaultStatus === "playing",
      controls: options.playback?.controls ?? false,
      defaultStatus: options.playback?.defaultStatus ?? "paused",
      loop: options.playback?.loop ?? false,
    };
    this.stageId = stageId;
    this.transition = normalizeTransition(options.transition);
    this.width = options.width;
    this.timeline = this.createTimeline();
  }

  get durationInFrames(): number {
    return this.timeline.durationInFrames;
  }

  getActiveFrameId(currentFrame: number): string | null {
    const frame = Math.max(0, Math.min(currentFrame, this.durationInFrames - 1));
    const item = [...this.timeline.items]
      .reverse()
      .find((candidate) => frame >= candidate.startFrame && frame < candidate.endFrame);

    return item?.frameId ?? null;
  }

  toJSON(): PlayerVideoOptions<TMetadata> {
    return {
      clipContent: this.clipContent,
      ...(this.description ? { description: this.description } : {}),
      fps: this.fps,
      frames: this.frames,
      height: this.height,
      id: this.id,
      ...(this.metadata ? { metadata: this.metadata } : {}),
      name: this.name,
      playback: this.playback,
      stageId: this.stageId,
      transition: this.transition,
      width: this.width,
    };
  }

  private createTimeline(): ResolvedTimeline {
    const edges: TimelineEdge[] = [];
    for (let index = 0; index < this.frames.length - 1; index += 1) {
      const fromFrame = this.frames[index];
      const toFrame = this.frames[index + 1];
      if (!fromFrame || !toFrame) {
        continue;
      }
      const transition = resolveEdgeTransition(fromFrame, toFrame, this.transition);
      const durationInFrames = transition.durationInFrames;

      if (durationInFrames > Math.min(fromFrame.durationInFrames, toFrame.durationInFrames)) {
        throw new Error(
          `PlayerVideo "${this.id}" transition between "${fromFrame.id}" and "${toFrame.id}" is longer than one of its frames.`,
        );
      }

      edges.push({
        durationInFrames,
        fromFrameId: fromFrame.id,
        toFrameId: toFrame.id,
        transition,
      });
    }

    const items: TimelineItem[] = [];
    let cursor = 0;
    for (let index = 0; index < this.frames.length; index += 1) {
      const frame = this.frames[index];
      if (!frame) {
        continue;
      }
      const inTransition = index > 0 ? edges[index - 1] : undefined;
      const outTransition = index < edges.length ? edges[index] : undefined;
      const startFrame = cursor;
      const endFrame = startFrame + frame.durationInFrames;

      if ((inTransition?.durationInFrames ?? 0) + (outTransition?.durationInFrames ?? 0) > frame.durationInFrames) {
        throw new Error(`PlayerVideo "${this.id}" frame "${frame.id}" transition ranges overlap its full duration.`);
      }

      items.push({
        endFrame,
        frameId: frame.id,
        index,
        ...(inTransition ? { inTransition } : {}),
        ...(outTransition ? { outTransition } : {}),
        startFrame,
      });

      cursor = endFrame - (outTransition?.durationInFrames ?? 0);
    }

    return {
      durationInFrames: items.at(-1)?.endFrame ?? 0,
      edges,
      items,
    };
  }
}
