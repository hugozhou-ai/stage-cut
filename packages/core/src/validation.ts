import type {
  JsonObject,
  JsonValue,
  LayerDefinition,
  PlaybackOptions,
  SceneDefinition,
  StagecutProjectDefinition,
  StagecutValidationIssue,
  SurfaceDefinition,
  TransitionConfig,
  TransitionName,
  VideoDefinition,
} from "./types";

const TRANSITION_NAMES = new Set<TransitionName>([
  "none",
  "fade",
  "slideLeft",
  "slideRight",
  "slideUp",
  "slideDown",
  "zoomIn",
  "zoomOut",
  "wipeLeft",
]);

export class StagecutValidationError extends Error {
  readonly issues: readonly StagecutValidationIssue[];

  constructor(issues: readonly StagecutValidationIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "StagecutValidationError";
    this.issues = issues;
  }
}

class ProjectParser {
  private readonly issues: StagecutValidationIssue[] = [];

  parse(input: unknown): StagecutProjectDefinition {
    const root = this.record(input, "$", [
      "description",
      "id",
      "metadata",
      "name",
      "schemaVersion",
      "stages",
      "surfaces",
      "videos",
    ]);
    const schemaVersion = root.schemaVersion;
    if (schemaVersion !== 1) {
      this.issue("unsupported_schema", "$.schemaVersion", "must be exactly 1");
    }

    const project: StagecutProjectDefinition = {
      ...((this.optionalString(root.description, "$.description") as string | undefined)
        ? { description: root.description as string }
        : {}),
      id: this.id(root.id, "$.id"),
      ...(root.metadata === undefined ? {} : { metadata: this.jsonObject(root.metadata, "$.metadata") }),
      name: this.nonEmptyString(root.name, "$.name"),
      schemaVersion: 1,
      stages: this.array(root.stages, "$.stages").map((stage, index) => this.stage(stage, `$.stages[${index}]`)),
      surfaces: this.array(root.surfaces, "$.surfaces").map((surface, index) =>
        this.surface(surface, `$.surfaces[${index}]`),
      ),
      videos: this.array(root.videos, "$.videos").map((video, index) => this.video(video, `$.videos[${index}]`)),
    };

    this.requireNonEmpty(project.stages, "$.stages");
    this.requireNonEmpty(project.videos, "$.videos");
    this.uniqueIds(project.stages, "$.stages");
    this.uniqueIds(project.surfaces, "$.surfaces");
    this.uniqueIds(project.videos, "$.videos");
    this.validateReferences(project);
    this.throwIfInvalid();
    return project;
  }

  private array(value: unknown, path: string): unknown[] {
    if (!Array.isArray(value)) {
      this.issue("invalid_type", path, "must be an array");
      return [];
    }
    return value;
  }

  private boolean(value: unknown, path: string): boolean {
    if (typeof value !== "boolean") {
      this.issue("invalid_type", path, "must be a boolean");
      return false;
    }
    return value;
  }

  private id(value: unknown, path: string): string {
    const id = this.nonEmptyString(value, path);
    if (id.trim() !== id) {
      this.issue("invalid_id", path, "must not contain leading or trailing whitespace");
    }
    return id;
  }

  private issue(code: string, path: string, message: string): void {
    this.issues.push({ code, message, path });
  }

  private jsonObject(value: unknown, path: string): JsonObject {
    const parsed = this.jsonValue(value, path);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      this.issue("invalid_type", path, "must be a JSON object");
      return {};
    }
    return parsed;
  }

  private jsonValue(value: unknown, path: string): JsonValue {
    if (value === null || typeof value === "string" || typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        this.issue("invalid_json", path, "must be a finite JSON number");
        return 0;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => this.jsonValue(item, `${path}[${index}]`));
    }
    if (value !== null && typeof value === "object") {
      const result: JsonObject = {};
      for (const [key, nested] of Object.entries(value)) {
        result[key] = this.jsonValue(nested, `${path}.${key}`);
      }
      return result;
    }
    this.issue("invalid_json", path, "must contain only JSON-compatible values");
    return null;
  }

  private layer(input: unknown, path: string): LayerDefinition {
    const layer = this.record(input, path, ["id", "inputProps", "metadata", "surfaceId"]);
    return {
      id: this.id(layer.id, `${path}.id`),
      ...(layer.inputProps === undefined
        ? {}
        : { inputProps: this.jsonObject(layer.inputProps, `${path}.inputProps`) }),
      ...(layer.metadata === undefined ? {} : { metadata: this.jsonObject(layer.metadata, `${path}.metadata`) }),
      surfaceId: this.id(layer.surfaceId, `${path}.surfaceId`),
    };
  }

  private nonEmptyString(value: unknown, path: string): string {
    if (typeof value !== "string") {
      this.issue("invalid_type", path, "must be a string");
      return "";
    }
    if (value.length === 0) {
      this.issue("required", path, "must not be empty");
    }
    return value;
  }

  private optionalString(value: unknown, path: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value !== "string") {
      this.issue("invalid_type", path, "must be a string");
      return undefined;
    }
    return value;
  }

  private playback(input: unknown, path: string): PlaybackOptions {
    const playback = this.record(input, path, ["autoPlay", "controls", "defaultStatus", "loop"]);
    const defaultStatus = playback.defaultStatus;
    if (defaultStatus !== undefined && defaultStatus !== "paused" && defaultStatus !== "playing") {
      this.issue("invalid_value", `${path}.defaultStatus`, 'must be either "paused" or "playing"');
    }
    return {
      ...(playback.autoPlay === undefined ? {} : { autoPlay: this.boolean(playback.autoPlay, `${path}.autoPlay`) }),
      ...(playback.controls === undefined ? {} : { controls: this.boolean(playback.controls, `${path}.controls`) }),
      ...(defaultStatus === "paused" || defaultStatus === "playing" ? { defaultStatus } : {}),
      ...(playback.loop === undefined ? {} : { loop: this.boolean(playback.loop, `${path}.loop`) }),
    };
  }

  private positiveInteger(value: unknown, path: string): number {
    if (!Number.isSafeInteger(value) || (value as number) <= 0) {
      this.issue("invalid_number", path, "must be a positive safe integer");
      return 1;
    }
    return value as number;
  }

  private record(value: unknown, path: string, allowedKeys: readonly string[]): Record<string, unknown> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      this.issue("invalid_type", path, "must be an object");
      return {};
    }
    const record = value as Record<string, unknown>;
    const allowed = new Set(allowedKeys);
    for (const key of Object.keys(record)) {
      if (!allowed.has(key)) {
        this.issue("unknown_key", `${path}.${key}`, "is not supported");
      }
    }
    return record;
  }

  private requireNonEmpty(value: readonly unknown[], path: string): void {
    if (value.length === 0) {
      this.issue("required", path, "must contain at least one item");
    }
  }

  private scene(input: unknown, path: string): SceneDefinition {
    const scene = this.record(input, path, [
      "durationInFrames",
      "id",
      "layers",
      "metadata",
      "name",
      "transitionToNext",
    ]);
    const layers = this.array(scene.layers, `${path}.layers`).map((layer, index) =>
      this.layer(layer, `${path}.layers[${index}]`),
    );
    this.uniqueIds(layers, `${path}.layers`);
    return {
      durationInFrames: this.positiveInteger(scene.durationInFrames, `${path}.durationInFrames`),
      id: this.id(scene.id, `${path}.id`),
      layers,
      ...(scene.metadata === undefined ? {} : { metadata: this.jsonObject(scene.metadata, `${path}.metadata`) }),
      ...(this.optionalString(scene.name, `${path}.name`) === undefined ? {} : { name: scene.name as string }),
      ...(scene.transitionToNext === undefined
        ? {}
        : { transitionToNext: this.transition(scene.transitionToNext, `${path}.transitionToNext`) }),
    };
  }

  private stage(input: unknown, path: string) {
    const stage = this.record(input, path, ["background", "height", "id", "metadata", "name", "width"]);
    return {
      ...(this.optionalString(stage.background, `${path}.background`) === undefined
        ? {}
        : { background: stage.background as string }),
      height: this.positiveInteger(stage.height, `${path}.height`),
      id: this.id(stage.id, `${path}.id`),
      ...(stage.metadata === undefined ? {} : { metadata: this.jsonObject(stage.metadata, `${path}.metadata`) }),
      name: this.nonEmptyString(stage.name, `${path}.name`),
      width: this.positiveInteger(stage.width, `${path}.width`),
    };
  }

  private surface(input: unknown, path: string): SurfaceDefinition {
    const surface = this.record(input, path, ["description", "id", "metadata", "name"]);
    return {
      ...(this.optionalString(surface.description, `${path}.description`) === undefined
        ? {}
        : { description: surface.description as string }),
      id: this.id(surface.id, `${path}.id`),
      ...(surface.metadata === undefined ? {} : { metadata: this.jsonObject(surface.metadata, `${path}.metadata`) }),
      name: this.nonEmptyString(surface.name, `${path}.name`),
    };
  }

  private throwIfInvalid(): void {
    if (this.issues.length > 0) {
      throw new StagecutValidationError(this.issues);
    }
  }

  private transition(input: unknown, path: string): TransitionConfig {
    const transition = this.record(input, path, ["durationInFrames", "kind"]);
    const kind = transition.kind;
    if (typeof kind !== "string" || !TRANSITION_NAMES.has(kind as TransitionName)) {
      this.issue("invalid_transition", `${path}.kind`, "must be a supported transition kind");
    }
    return {
      ...(transition.durationInFrames === undefined
        ? {}
        : { durationInFrames: this.nonNegativeInteger(transition.durationInFrames, `${path}.durationInFrames`) }),
      kind: TRANSITION_NAMES.has(kind as TransitionName) ? (kind as TransitionName) : "none",
    };
  }

  private nonNegativeInteger(value: unknown, path: string): number {
    if (!Number.isSafeInteger(value) || (value as number) < 0) {
      this.issue("invalid_number", path, "must be a non-negative safe integer");
      return 0;
    }
    return value as number;
  }

  private uniqueIds(items: readonly { id: string }[], path: string): void {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.id)) {
        this.issue("duplicate_id", `${path}[${index}].id`, `duplicates id "${item.id}"`);
      }
      seen.add(item.id);
    });
  }

  private validateReferences(project: StagecutProjectDefinition): void {
    const stageIds = new Set(project.stages.map((stage) => stage.id));
    const surfaceIds = new Set(project.surfaces.map((surface) => surface.id));
    project.videos.forEach((video, videoIndex) => {
      const videoPath = `$.videos[${videoIndex}]`;
      if (!stageIds.has(video.stageId)) {
        this.issue("unknown_reference", `${videoPath}.stageId`, `references unknown stage "${video.stageId}"`);
      }
      video.scenes.forEach((scene, sceneIndex) => {
        const scenePath = `${videoPath}.scenes[${sceneIndex}]`;
        scene.layers.forEach((layer, layerIndex) => {
          if (!surfaceIds.has(layer.surfaceId)) {
            this.issue(
              "unknown_reference",
              `${scenePath}.layers[${layerIndex}].surfaceId`,
              `references unknown surface "${layer.surfaceId}"`,
            );
          }
        });
        if (sceneIndex === video.scenes.length - 1 && scene.transitionToNext !== undefined) {
          this.issue("invalid_transition", `${scenePath}.transitionToNext`, "is not allowed on the final scene");
        }
      });
    });
  }

  private video(input: unknown, path: string): VideoDefinition {
    const video = this.record(input, path, [
      "clipContent",
      "defaultTransition",
      "description",
      "fps",
      "id",
      "metadata",
      "name",
      "playback",
      "scenes",
      "stageId",
    ]);
    const scenes = this.array(video.scenes, `${path}.scenes`).map((scene, index) =>
      this.scene(scene, `${path}.scenes[${index}]`),
    );
    this.requireNonEmpty(scenes, `${path}.scenes`);
    this.uniqueIds(scenes, `${path}.scenes`);
    return {
      ...(video.clipContent === undefined
        ? {}
        : { clipContent: this.boolean(video.clipContent, `${path}.clipContent`) }),
      ...(video.defaultTransition === undefined
        ? {}
        : { defaultTransition: this.transition(video.defaultTransition, `${path}.defaultTransition`) }),
      ...(this.optionalString(video.description, `${path}.description`) === undefined
        ? {}
        : { description: video.description as string }),
      fps: this.positiveInteger(video.fps, `${path}.fps`),
      id: this.id(video.id, `${path}.id`),
      ...(video.metadata === undefined ? {} : { metadata: this.jsonObject(video.metadata, `${path}.metadata`) }),
      name: this.nonEmptyString(video.name, `${path}.name`),
      ...(video.playback === undefined ? {} : { playback: this.playback(video.playback, `${path}.playback`) }),
      scenes,
      stageId: this.id(video.stageId, `${path}.stageId`),
    };
  }
}

export function parseStagecutProject(input: unknown): StagecutProjectDefinition {
  return new ProjectParser().parse(input);
}
