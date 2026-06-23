import type {
  FrameTransitionOverrides,
  JsonObject,
  TransitionConfig,
  VideoFrameDefinition,
  VideoFrameOptions,
} from "./types";
import { normalizeId, validatePositiveInteger } from "./validation";

function normalizeFrameTransition(transition: VideoFrameOptions["transition"]): FrameTransitionOverrides | undefined {
  if (!transition) {
    return undefined;
  }

  if ("kind" in transition) {
    return { in: transition, out: transition };
  }

  return transition;
}

export class VideoFrame<TInputProps extends JsonObject = JsonObject, TMetadata extends JsonObject = JsonObject> {
  readonly durationInFrames: number;
  readonly id: string;
  readonly inputProps: TInputProps;
  readonly metadata: TMetadata | undefined;
  readonly surfaceId: string;
  readonly transition: FrameTransitionOverrides | undefined;

  constructor(options: VideoFrameOptions<TInputProps, TMetadata>) {
    const id = normalizeId(options.id, "VideoFrame");
    const surfaceId = normalizeId(options.surfaceId, `VideoFrame "${id}" surface`);
    validatePositiveInteger(`VideoFrame "${id}" durationInFrames`, options.durationInFrames);

    this.durationInFrames = options.durationInFrames;
    this.id = id;
    this.inputProps = options.inputProps ?? ({} as TInputProps);
    this.metadata = options.metadata;
    this.surfaceId = surfaceId;
    this.transition = normalizeFrameTransition(
      options.transition as TransitionConfig | FrameTransitionOverrides | undefined,
    );
  }

  toJSON(): VideoFrameDefinition<TInputProps, TMetadata> {
    return {
      durationInFrames: this.durationInFrames,
      id: this.id,
      inputProps: this.inputProps,
      ...(this.metadata ? { metadata: this.metadata } : {}),
      surfaceId: this.surfaceId,
      ...(this.transition ? { transition: this.transition } : {}),
    };
  }
}
