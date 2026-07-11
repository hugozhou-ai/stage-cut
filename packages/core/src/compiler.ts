import { normalizeTransition } from "./transitions";
import type {
  CompiledScene,
  CompiledStagecutVideo,
  JsonObject,
  SceneTransitionEdge,
  StagecutProjectDefinition,
  TransitionConfig,
} from "./types";
import { parseStagecutProject, StagecutValidationError } from "./validation";

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
}

function validationError(path: string, code: string, message: string): never {
  throw new StagecutValidationError([{ code, message, path }]);
}

function resolveEdgeTransition(
  transition: TransitionConfig | undefined,
  fallback: Required<TransitionConfig>,
): Required<TransitionConfig> {
  return normalizeTransition(transition ?? fallback);
}

function assertFrame(frame: number, durationInFrames: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame >= durationInFrames) {
    throw new RangeError(`Stagecut frame must be an integer from 0 to ${durationInFrames - 1}. Received ${frame}.`);
  }
}

export function compileStagecutVideo<TMetadata extends JsonObject = JsonObject>(
  inputProject: StagecutProjectDefinition,
  videoId: string,
): CompiledStagecutVideo<TMetadata> {
  const project = parseStagecutProject(inputProject);
  const video = project.videos.find((candidate) => candidate.id === videoId);
  if (!video) {
    validationError("$.videos", "unknown_video", `does not contain video "${videoId}"`);
  }
  const stage = project.stages.find((candidate) => candidate.id === video.stageId);
  if (!stage) {
    validationError("$.videos", "unknown_stage", `video "${videoId}" references an unknown stage`);
  }

  const defaultTransition = normalizeTransition(video.defaultTransition);
  const edges: SceneTransitionEdge[] = [];
  for (let index = 0; index < video.scenes.length - 1; index += 1) {
    const current = video.scenes[index] as (typeof video.scenes)[number];
    const next = video.scenes[index + 1] as (typeof video.scenes)[number];
    const transition = resolveEdgeTransition(current.transitionToNext, defaultTransition);
    if (transition.durationInFrames > Math.min(current.durationInFrames, next.durationInFrames)) {
      validationError(
        `$.videos[${project.videos.indexOf(video)}].scenes[${index}].transitionToNext`,
        "transition_too_long",
        `transition from "${current.id}" to "${next.id}" is longer than one of its scenes`,
      );
    }
    edges.push({
      durationInFrames: transition.durationInFrames,
      fromSceneId: current.id,
      toSceneId: next.id,
      transition,
    });
  }

  const scenes: CompiledScene[] = [];
  let cursor = 0;
  for (let index = 0; index < video.scenes.length; index += 1) {
    const scene = video.scenes[index] as (typeof video.scenes)[number];
    const inTransition = index > 0 ? edges[index - 1] : undefined;
    const outTransition = index < edges.length ? edges[index] : undefined;
    if ((inTransition?.durationInFrames ?? 0) + (outTransition?.durationInFrames ?? 0) > scene.durationInFrames) {
      validationError(
        `$.videos[${project.videos.indexOf(video)}].scenes[${index}]`,
        "transition_overlap",
        `scene "${scene.id}" transition ranges overlap its full duration`,
      );
    }
    const startFrame = cursor;
    const endFrame = startFrame + scene.durationInFrames;
    scenes.push({
      endFrame,
      ...(inTransition ? { inTransition } : {}),
      index,
      ...(outTransition ? { outTransition } : {}),
      scene,
      startFrame,
    });
    cursor = endFrame - (outTransition?.durationInFrames ?? 0);
  }

  const durationInFrames = scenes.at(-1)?.endFrame ?? 0;
  const findActiveSceneIndex = (frame: number): number => {
    assertFrame(frame, durationInFrames);
    let low = 0;
    let high = scenes.length - 1;
    let result = 0;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const candidate = scenes[middle];
      if (candidate && candidate.startFrame <= frame) {
        result = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return result;
  };

  const compiled: CompiledStagecutVideo<TMetadata> = {
    clipContent: video.clipContent ?? true,
    defaultTransition,
    ...(video.description === undefined ? {} : { description: video.description }),
    fps: video.fps,
    getActiveSceneIndex: findActiveSceneIndex,
    getRenderWindow(frame: number) {
      const activeIndex = findActiveSceneIndex(frame);
      const active = scenes[activeIndex];
      const previous = scenes[activeIndex - 1];
      if (!active) {
        throw new Error(`Compiled Stagecut video "${video.id}" has no active scene at frame ${frame}.`);
      }
      if (previous && previous.endFrame > frame) {
        return [previous, active];
      }
      return [active];
    },
    id: video.id,
    ...(video.metadata === undefined ? {} : { metadata: video.metadata as TMetadata }),
    name: video.name,
    playback: {
      autoPlay: video.playback?.autoPlay ?? video.playback?.defaultStatus === "playing",
      controls: video.playback?.controls ?? false,
      defaultStatus: video.playback?.defaultStatus ?? "paused",
      loop: video.playback?.loop ?? false,
    },
    projectId: project.id,
    stage,
    timeline: { durationInFrames, edges, scenes },
    video: video as typeof video & { metadata?: TMetadata },
  };

  return deepFreeze(compiled);
}
