import type {
  JsonObject,
  LayerDefinition,
  SceneDefinition,
  StagecutProjectDefinition,
  TransitionConfig,
  VideoDefinition,
} from "@stagecut/core";

export interface DevtoolsChangeOperation {
  after?: unknown;
  before?: unknown;
  layerId?: string;
  sceneId?: string;
  type: string;
  videoId: string;
}

export function cloneProject<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue;
}

export function replaceVideo(
  project: StagecutProjectDefinition,
  videoId: string,
  update: (video: VideoDefinition) => VideoDefinition,
): StagecutProjectDefinition {
  return {
    ...project,
    videos: project.videos.map((video) => (video.id === videoId ? update(video) : video)),
  };
}

export function replaceScene(
  project: StagecutProjectDefinition,
  videoId: string,
  sceneId: string,
  update: (scene: SceneDefinition) => SceneDefinition,
): StagecutProjectDefinition {
  return replaceVideo(project, videoId, (video) => ({
    ...video,
    scenes: video.scenes.map((scene) => (scene.id === sceneId ? update(scene) : scene)),
  }));
}

export function reorderById<TItem extends { readonly id: string }>(
  items: readonly TItem[],
  movedId: string,
  targetId: string,
): readonly TItem[] {
  if (movedId === targetId) return items;
  const moved = items.find((item) => item.id === movedId);
  if (!moved || !items.some((item) => item.id === targetId)) return items;
  const withoutMoved = items.filter((item) => item.id !== movedId);
  const targetIndex = withoutMoved.findIndex((item) => item.id === targetId);
  return [...withoutMoved.slice(0, targetIndex), moved, ...withoutMoved.slice(targetIndex)];
}

export function moveByOffset<TItem>(items: readonly TItem[], index: number, offset: -1 | 1): readonly TItem[] {
  const targetIndex = index + offset;
  if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items;
  const copy = [...items];
  const current = copy[index];
  const target = copy[targetIndex];
  if (current === undefined || target === undefined) return items;
  copy[index] = target;
  copy[targetIndex] = current;
  return copy;
}

export function createUniqueId(existingIds: readonly string[], base: string): string {
  if (!existingIds.includes(base)) return base;
  let suffix = 2;
  while (existingIds.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function createScene(video: VideoDefinition): SceneDefinition {
  const id = createUniqueId(
    video.scenes.map((scene) => scene.id),
    "scene",
  );
  return { durationInFrames: video.fps, id, layers: [], name: "New scene" };
}

export function duplicateScene(video: VideoDefinition, source: SceneDefinition): SceneDefinition {
  const id = createUniqueId(
    video.scenes.map((scene) => scene.id),
    `${source.id}-copy`,
  );
  return cloneProject(source.name ? { ...source, id, name: `${source.name} copy` } : { ...source, id });
}

export function createLayer(scene: SceneDefinition, surfaceId: string): LayerDefinition {
  return {
    id: createUniqueId(
      scene.layers.map((layer) => layer.id),
      "layer",
    ),
    inputProps: {},
    surfaceId,
  };
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function optionalValue(value: unknown): unknown {
  return value === undefined ? null : value;
}

function pushFieldChange(
  operations: DevtoolsChangeOperation[],
  context: { layerId?: string; sceneId?: string; videoId: string },
  type: string,
  before: unknown,
  after: unknown,
): void {
  if (equal(before, after)) return;
  operations.push({ ...context, after: optionalValue(after), before: optionalValue(before), type });
}

function diffLayers(
  operations: DevtoolsChangeOperation[],
  videoId: string,
  sceneId: string,
  before: readonly LayerDefinition[],
  after: readonly LayerDefinition[],
): void {
  const beforeById = new Map(before.map((layer) => [layer.id, layer]));
  const afterById = new Map(after.map((layer) => [layer.id, layer]));
  for (const layer of before) {
    if (!afterById.has(layer.id)) {
      operations.push({ before: layer, layerId: layer.id, sceneId, type: "remove-layer", videoId });
    }
  }
  for (const layer of after) {
    const previous = beforeById.get(layer.id);
    if (!previous) {
      operations.push({ after: layer, layerId: layer.id, sceneId, type: "add-layer", videoId });
      continue;
    }
    pushFieldChange(
      operations,
      { layerId: layer.id, sceneId, videoId },
      "change-layer-surface",
      previous.surfaceId,
      layer.surfaceId,
    );
    pushFieldChange(
      operations,
      { layerId: layer.id, sceneId, videoId },
      "change-layer-input",
      previous.inputProps ?? {},
      layer.inputProps ?? {},
    );
  }
  pushFieldChange(
    operations,
    { sceneId, videoId },
    "reorder-layers",
    before.map((layer) => layer.id),
    after.map((layer) => layer.id),
  );
}

function diffVideo(operations: DevtoolsChangeOperation[], before: VideoDefinition, after: VideoDefinition): void {
  const beforeById = new Map(before.scenes.map((scene) => [scene.id, scene]));
  const afterById = new Map(after.scenes.map((scene) => [scene.id, scene]));
  for (const scene of before.scenes) {
    if (!afterById.has(scene.id)) {
      operations.push({ before: scene, sceneId: scene.id, type: "remove-scene", videoId: before.id });
    }
  }
  for (const scene of after.scenes) {
    const previous = beforeById.get(scene.id);
    if (!previous) {
      operations.push({ after: scene, sceneId: scene.id, type: "add-scene", videoId: before.id });
      continue;
    }
    pushFieldChange(
      operations,
      { sceneId: scene.id, videoId: before.id },
      "change-scene-name",
      previous.name,
      scene.name,
    );
    pushFieldChange(
      operations,
      { sceneId: scene.id, videoId: before.id },
      "change-scene-duration",
      previous.durationInFrames,
      scene.durationInFrames,
    );
    pushFieldChange(
      operations,
      { sceneId: scene.id, videoId: before.id },
      "change-scene-transition",
      previous.transitionToNext,
      scene.transitionToNext,
    );
    diffLayers(operations, before.id, scene.id, previous.layers, scene.layers);
  }
  pushFieldChange(
    operations,
    { videoId: before.id },
    "reorder-scenes",
    before.scenes.map((scene) => scene.id),
    after.scenes.map((scene) => scene.id),
  );
}

export function createChangeOperations(
  base: StagecutProjectDefinition,
  draft: StagecutProjectDefinition,
): readonly DevtoolsChangeOperation[] {
  const operations: DevtoolsChangeOperation[] = [];
  const draftVideos = new Map(draft.videos.map((video) => [video.id, video]));
  for (const video of base.videos) {
    const next = draftVideos.get(video.id);
    if (next) diffVideo(operations, video, next);
  }
  return operations;
}

export function createAgentPrompt(base: StagecutProjectDefinition, draft: StagecutProjectDefinition): string {
  const operations = createChangeOperations(base, draft);
  return [
    `请修改 Stagecut 项目「${base.name}」(${base.id}) 的源码，实现下面的时间线调整。`,
    "仅修改变更清单涉及的 Video、Scene 和 Layer；保持其他定义、稳定 ID 与 Surface 实现不变。",
    "完成后运行项目的 lint、type-check、test 和 build，并修复由这些调整产生的根因问题。",
    "",
    "结构化变更清单：",
    "```json",
    JSON.stringify({ operations, projectId: base.id, schemaVersion: 1 }, null, 2),
    "```",
  ].join("\n");
}

export function hasProjectChanges(base: StagecutProjectDefinition, draft: StagecutProjectDefinition): boolean {
  return createChangeOperations(base, draft).length > 0;
}

export function updateLayerInput(
  project: StagecutProjectDefinition,
  videoId: string,
  sceneId: string,
  layerId: string,
  inputProps: JsonObject,
): StagecutProjectDefinition {
  return replaceScene(project, videoId, sceneId, (scene) => ({
    ...scene,
    layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, inputProps } : layer)),
  }));
}

export function updateTransition(
  project: StagecutProjectDefinition,
  videoId: string,
  sceneId: string,
  transitionToNext: TransitionConfig | undefined,
): StagecutProjectDefinition {
  return replaceScene(project, videoId, sceneId, (scene) => {
    const { transitionToNext: _previous, ...rest } = scene;
    return transitionToNext ? { ...rest, transitionToNext } : rest;
  });
}
