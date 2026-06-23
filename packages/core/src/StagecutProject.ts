import { PlayerVideo } from "./PlayerVideo";
import type {
  JsonObject,
  StagecutProjectJson,
  StagecutProjectOptions,
  StageDefinition,
  SurfaceDefinition,
} from "./types";
import { assertUniqueIds, normalizeId, validatePositiveInteger } from "./validation";

export class StagecutProject<TMetadata extends JsonObject = JsonObject> {
  readonly description: string | undefined;
  readonly id: string;
  readonly metadata: TMetadata | undefined;
  readonly name: string;
  readonly stages: StageDefinition[];
  readonly surfaces: SurfaceDefinition[];
  readonly videos: PlayerVideo[];

  constructor(options: StagecutProjectOptions<TMetadata>) {
    const id = normalizeId(options.id, "StagecutProject");
    if (options.stages.length === 0) {
      throw new Error(`StagecutProject "${id}" requires at least one stage.`);
    }
    if (options.surfaces.length === 0) {
      throw new Error(`StagecutProject "${id}" requires at least one surface.`);
    }
    if (options.videos.length === 0) {
      throw new Error(`StagecutProject "${id}" requires at least one video.`);
    }

    const stages = options.stages.map((stage) => ({
      ...stage,
      id: normalizeId(stage.id, "StageDefinition"),
    }));
    const surfaces = options.surfaces.map((surface) => ({
      ...surface,
      id: normalizeId(surface.id, "SurfaceDefinition"),
    }));

    for (const stage of stages) {
      validatePositiveInteger(`StageDefinition "${stage.id}" width`, stage.width);
      validatePositiveInteger(`StageDefinition "${stage.id}" height`, stage.height);
    }
    assertUniqueIds(`StagecutProject "${id}" stages`, stages);
    assertUniqueIds(`StagecutProject "${id}" surfaces`, surfaces);

    const stageIds = new Set(stages.map((stage) => stage.id));
    const surfaceIds = new Set(surfaces.map((surface) => surface.id));
    const videos = options.videos.map((video) => new PlayerVideo(video));
    assertUniqueIds(`StagecutProject "${id}" videos`, videos);

    for (const video of videos) {
      if (!stageIds.has(video.stageId)) {
        throw new Error(`PlayerVideo "${video.id}" references unknown stage "${video.stageId}".`);
      }
      for (const frame of video.frames) {
        if (!surfaceIds.has(frame.surfaceId)) {
          throw new Error(`VideoFrame "${frame.id}" references unknown surface "${frame.surfaceId}".`);
        }
      }
    }

    this.description = options.description;
    this.id = id;
    this.metadata = options.metadata;
    this.name = options.name;
    this.stages = stages;
    this.surfaces = surfaces;
    this.videos = videos;
  }

  getVideo(videoId: string): PlayerVideo {
    const video = this.videos.find((candidate) => candidate.id === videoId);
    if (!video) {
      throw new Error(`StagecutProject "${this.id}" does not contain video "${videoId}".`);
    }

    return video;
  }

  toJSON(): StagecutProjectJson<TMetadata> {
    return {
      schemaVersion: 1,
      ...(this.description ? { description: this.description } : {}),
      id: this.id,
      ...(this.metadata ? { metadata: this.metadata } : {}),
      name: this.name,
      stages: this.stages,
      surfaces: this.surfaces,
      videos: this.videos.map((video) => video.toJSON()),
    };
  }

  static fromJSON<TMetadata extends JsonObject = JsonObject>(
    json: StagecutProjectJson<TMetadata>,
  ): StagecutProject<TMetadata> {
    if (json.schemaVersion !== 1) {
      throw new Error(`Unsupported Stagecut project schemaVersion "${json.schemaVersion}".`);
    }

    return new StagecutProject(json);
  }
}
