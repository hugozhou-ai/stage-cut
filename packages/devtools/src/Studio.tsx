import {
  type CompiledStagecutVideo,
  compileStagecutVideo,
  type JsonObject,
  type SceneDefinition,
  type StagecutProjectDefinition,
  type StagecutValidationIssue,
  safeParseStagecutProject,
  type TransitionName,
  type VideoDefinition,
} from "@stage-cut/core";
import {
  StagecutPlayer,
  type SurfaceComponentMap,
  useStagecutPlayerController,
  useStagecutPlayerState,
} from "@stage-cut/react-player";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  cloneProject,
  createAgentPrompt,
  createLayer,
  createScene,
  duplicateScene,
  hasProjectChanges,
  moveByOffset,
  reorderById,
  replaceScene,
  replaceVideo,
  updateLayerInput,
  updateTransition,
} from "./draft";

const LOG_PREFIX = "[stagecut:devtools]";
const TRANSITIONS: readonly TransitionName[] = [
  "none",
  "fade",
  "slideLeft",
  "slideRight",
  "slideUp",
  "slideDown",
  "zoomIn",
  "zoomOut",
  "wipeLeft",
];

interface CompileResult {
  issues: readonly StagecutValidationIssue[];
  video?: CompiledStagecutVideo;
}

interface StoredDraft {
  base: string;
  draft: StagecutProjectDefinition;
}

export interface StudioProps {
  acknowledgeRemotionLicense: boolean;
  project: StagecutProjectDefinition;
  surfaces: SurfaceComponentMap;
}

function storageKey(projectId: string): string {
  return `stagecut:devtools:${projectId}`;
}

function logError(event: string, error: unknown): void {
  console.error(
    `${LOG_PREFIX} ${JSON.stringify({ event, message: error instanceof Error ? error.message : String(error) })}`,
  );
}

function loadDraft(project: StagecutProjectDefinition): { conflict: boolean; draft: StagecutProjectDefinition } {
  try {
    const raw = window.sessionStorage.getItem(storageKey(project.id));
    if (!raw) return { conflict: false, draft: cloneProject(project) };
    const stored = JSON.parse(raw) as Partial<StoredDraft>;
    if (
      typeof stored.base !== "string" ||
      !stored.draft ||
      typeof stored.draft !== "object" ||
      !Array.isArray(stored.draft.videos)
    ) {
      throw new Error("Stored draft has an invalid shape.");
    }
    if (stored.base !== JSON.stringify(project)) return { conflict: true, draft: cloneProject(project) };
    return { conflict: false, draft: stored.draft };
  } catch (error) {
    logError("draft-load-error", error);
    return { conflict: false, draft: cloneProject(project) };
  }
}

function compileDraft(
  project: StagecutProjectDefinition,
  videoId: string,
  surfaces: SurfaceComponentMap,
): CompileResult {
  const parsed = safeParseStagecutProject(project);
  if (!parsed.success) return { issues: parsed.error.issues };
  const video = parsed.data.videos.find((candidate) => candidate.id === videoId);
  if (!video)
    return { issues: [{ code: "unknown_video", message: `Video "${videoId}" does not exist.`, path: "$.videos" }] };
  const missingSurfaces = [
    ...new Set(video.scenes.flatMap((scene) => scene.layers.map((layer) => layer.surfaceId))),
  ].filter((surfaceId) => !(surfaceId in surfaces));
  if (missingSurfaces.length > 0) {
    return {
      issues: missingSurfaces.map((surfaceId) => ({
        code: "missing_surface_component",
        message: `Surface "${surfaceId}" is not registered in the supplied component map.`,
        path: "$.surfaces",
      })),
    };
  }
  try {
    return { issues: [], video: compileStagecutVideo(parsed.data, videoId) };
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)) {
      return { issues: error.issues as readonly StagecutValidationIssue[] };
    }
    return {
      issues: [{ code: "compile_error", message: error instanceof Error ? error.message : String(error), path: "$" }],
    };
  }
}

function formatFrame(frame: number, fps: number): string {
  const seconds = Math.floor(frame / fps);
  return `${String(seconds).padStart(2, "0")}:${String(frame % fps).padStart(2, "0")}`;
}

function Preview({
  acknowledgeRemotionLicense,
  surfaces,
  video,
  seekSceneId,
}: {
  acknowledgeRemotionLicense: boolean;
  seekSceneId: string;
  surfaces: SurfaceComponentMap;
  video: CompiledStagecutVideo;
}) {
  const controller = useStagecutPlayerController(video);
  const state = useStagecutPlayerState(controller);
  const [runtimeError, setRuntimeError] = useState<string>();
  const activeIndex = video.getActiveSceneIndex(state.currentFrame);
  const active = video.timeline.scenes[activeIndex];
  const windowScenes = video.getRenderWindow(state.currentFrame);
  const localFrame = active ? state.currentFrame - active.startFrame : 0;
  const progress = active ? localFrame / Math.max(1, active.scene.durationInFrames - 1) : 0;
  const playing = state.status === "playing";

  useEffect(() => {
    if (!state.isReady) return;
    const target = video.timeline.scenes.find((candidate) => candidate.scene.id === seekSceneId);
    if (target) controller.seekToFrame(target.startFrame);
  }, [controller, seekSceneId, state.isReady, video]);

  return (
    <>
      <div className="stagecut-devtools-preview">
        <div className="stagecut-devtools-player-shell">
          <StagecutPlayer
            acknowledgeRemotionLicense={acknowledgeRemotionLicense}
            controller={controller}
            onError={(error) => setRuntimeError(error.message)}
            surfaces={surfaces}
            video={video}
          />
        </div>
      </div>
      <div className="stagecut-devtools-transport">
        <div className="stagecut-devtools-transport-buttons">
          <button className="stagecut-devtools-button" onClick={() => controller.stepByFrames(-1)} type="button">
            −1f
          </button>
          <button
            className="stagecut-devtools-button primary"
            onClick={() => (playing ? controller.pause() : controller.play())}
            type="button"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button className="stagecut-devtools-button" onClick={() => controller.stepByFrames(1)} type="button">
            +1f
          </button>
        </div>
        <input
          aria-label="Timeline frame"
          className="stagecut-devtools-range"
          max={video.timeline.durationInFrames - 1}
          min={0}
          onChange={(event) => controller.seekToFrame(Number(event.currentTarget.value))}
          type="range"
          value={state.currentFrame}
        />
        <span className="stagecut-devtools-time">
          {formatFrame(state.currentFrame, video.fps)} / {formatFrame(video.timeline.durationInFrames - 1, video.fps)}
        </span>
      </div>
      <div className="stagecut-devtools-debug">
        <DebugStat label="Global frame" value={state.currentFrame} />
        <DebugStat label="Local frame" value={localFrame} />
        <DebugStat label="Progress" value={`${Math.round(progress * 1000) / 10}%`} />
        <DebugStat label="Active scene" subvalue={`${windowScenes.length} mounted`} value={active?.scene.id ?? "—"} />
        <DebugStat
          label="Runtime"
          subvalue={
            runtimeError ??
            state.lastError ??
            `${windowScenes.flatMap((scene) => scene.scene.layers).length} live layers`
          }
          value={state.status}
        />
      </div>
    </>
  );
}

function DebugStat({ label, subvalue, value }: { label: string; subvalue?: string; value: number | string }) {
  return (
    <div className="stagecut-devtools-stat">
      <span>{label}</span>
      <strong title={String(value)}>{value}</strong>
      {subvalue ? <small>{subvalue}</small> : null}
    </div>
  );
}

function JsonInput({ onCommit, value }: { onCommit: (value: JsonObject) => void; value: JsonObject | undefined }) {
  const formatted = JSON.stringify(value ?? {}, null, 2);
  const [text, setText] = useState(formatted);
  const [error, setError] = useState<string>();
  useEffect(() => {
    setText(formatted);
    setError(undefined);
  }, [formatted]);
  const commit = () => {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
        throw new Error("inputProps must be a JSON object.");
      onCommit(parsed as JsonObject);
      setText(JSON.stringify(parsed, null, 2));
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };
  return (
    <label className="stagecut-devtools-field">
      <span>inputProps JSON</span>
      <textarea
        aria-label="Layer inputProps JSON"
        className="stagecut-devtools-textarea"
        onBlur={commit}
        onChange={(event) => setText(event.currentTarget.value)}
        spellCheck={false}
        value={text}
      />
      {error ? <small className="stagecut-devtools-error">{error}</small> : null}
    </label>
  );
}

function SceneInspector({
  onDraft,
  project,
  scene,
  video,
}: {
  onDraft: (project: StagecutProjectDefinition) => void;
  project: StagecutProjectDefinition;
  scene: SceneDefinition;
  video: VideoDefinition;
}) {
  const patchScene = (update: (scene: SceneDefinition) => SceneDefinition) =>
    onDraft(replaceScene(project, video.id, scene.id, update));
  const updateLayer = (
    layerId: string,
    update: (layer: SceneDefinition["layers"][number]) => SceneDefinition["layers"][number],
  ) =>
    patchScene((current) => ({
      ...current,
      layers: current.layers.map((layer) => (layer.id === layerId ? update(layer) : layer)),
    }));

  return (
    <>
      <div className="stagecut-devtools-section">
        <div className="stagecut-devtools-label">
          <span>Scene inspector</span>
          <span>{scene.id}</span>
        </div>
        <label className="stagecut-devtools-field">
          <span>Name</span>
          <input
            className="stagecut-devtools-input"
            onChange={(event) => patchScene((current) => ({ ...current, name: event.currentTarget.value }))}
            value={scene.name ?? ""}
          />
        </label>
        <label className="stagecut-devtools-field">
          <span>Duration in frames</span>
          <input
            className="stagecut-devtools-input"
            min={1}
            onChange={(event) =>
              patchScene((current) => ({ ...current, durationInFrames: Number(event.currentTarget.value) }))
            }
            type="number"
            value={scene.durationInFrames}
          />
        </label>
        <div className="stagecut-devtools-field-row">
          <label className="stagecut-devtools-field">
            <span>Transition</span>
            <select
              className="stagecut-devtools-select"
              onChange={(event) => {
                const kind = event.currentTarget.value as TransitionName | "default";
                onDraft(
                  updateTransition(
                    project,
                    video.id,
                    scene.id,
                    kind === "default"
                      ? undefined
                      : { durationInFrames: scene.transitionToNext?.durationInFrames ?? 0, kind },
                  ),
                );
              }}
              value={scene.transitionToNext?.kind ?? "default"}
            >
              <option value="default">Video default</option>
              {TRANSITIONS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>
          <label className="stagecut-devtools-field">
            <span>Transition frames</span>
            <input
              className="stagecut-devtools-input"
              disabled={!scene.transitionToNext}
              min={0}
              onChange={(event) =>
                scene.transitionToNext &&
                onDraft(
                  updateTransition(project, video.id, scene.id, {
                    ...scene.transitionToNext,
                    durationInFrames: Number(event.currentTarget.value),
                  }),
                )
              }
              type="number"
              value={scene.transitionToNext?.durationInFrames ?? 0}
            />
          </label>
        </div>
      </div>
      <div className="stagecut-devtools-section">
        <div className="stagecut-devtools-label">
          <span>Layers</span>
          <span>{scene.layers.length}</span>
        </div>
        {scene.layers.map((layer, index) => (
          <div className="stagecut-devtools-layer" key={layer.id}>
            <div className="stagecut-devtools-layer-head">
              <strong>{layer.id}</strong>
              <div className="stagecut-devtools-mini-actions">
                <button
                  aria-label={`Move ${layer.id} up`}
                  disabled={index === 0}
                  onClick={() =>
                    patchScene((current) => ({ ...current, layers: moveByOffset(current.layers, index, -1) }))
                  }
                  type="button"
                >
                  ↑
                </button>
                <button
                  aria-label={`Move ${layer.id} down`}
                  disabled={index === scene.layers.length - 1}
                  onClick={() =>
                    patchScene((current) => ({ ...current, layers: moveByOffset(current.layers, index, 1) }))
                  }
                  type="button"
                >
                  ↓
                </button>
                <button
                  aria-label={`Delete ${layer.id}`}
                  onClick={() =>
                    patchScene((current) => ({
                      ...current,
                      layers: current.layers.filter((item) => item.id !== layer.id),
                    }))
                  }
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
            <label className="stagecut-devtools-field">
              <span>Layer ID</span>
              <input
                className="stagecut-devtools-input"
                onChange={(event) =>
                  updateLayer(layer.id, (current) => ({ ...current, id: event.currentTarget.value }))
                }
                value={layer.id}
              />
            </label>
            <label className="stagecut-devtools-field">
              <span>Surface</span>
              <select
                className="stagecut-devtools-select"
                onChange={(event) =>
                  updateLayer(layer.id, (current) => ({ ...current, surfaceId: event.currentTarget.value }))
                }
                value={layer.surfaceId}
              >
                {project.surfaces.map((surface) => (
                  <option key={surface.id} value={surface.id}>
                    {surface.name} ({surface.id})
                  </option>
                ))}
              </select>
            </label>
            <JsonInput
              onCommit={(inputProps) => onDraft(updateLayerInput(project, video.id, scene.id, layer.id, inputProps))}
              value={layer.inputProps}
            />
          </div>
        ))}
        <button
          className="stagecut-devtools-button"
          disabled={project.surfaces.length === 0}
          onClick={() =>
            patchScene((current) => ({
              ...current,
              layers: [...current.layers, createLayer(current, project.surfaces[0]?.id ?? "")],
            }))
          }
          type="button"
        >
          Add layer
        </button>
      </div>
    </>
  );
}

export function Studio({ acknowledgeRemotionLicense, project, surfaces }: StudioProps) {
  const initial = useMemo(() => loadDraft(project), [project]);
  const [draft, setDraft] = useState(initial.draft);
  const [sourceConflict, setSourceConflict] = useState(initial.conflict);
  const [selectedVideoId, setSelectedVideoId] = useState(draft.videos[0]?.id ?? "");
  const [selectedSceneId, setSelectedSceneId] = useState(draft.videos[0]?.scenes[0]?.id ?? "");
  const [draggedSceneId, setDraggedSceneId] = useState<string>();
  const [status, setStatus] = useState<string>();
  const baseSnapshot = useMemo(() => JSON.stringify(project), [project]);
  const sourceSnapshotRef = useRef(baseSnapshot);
  const sourceChanged = sourceSnapshotRef.current !== baseSnapshot;
  const video = draft.videos.find((candidate) => candidate.id === selectedVideoId) ?? draft.videos[0];
  const scene = video?.scenes.find((candidate) => candidate.id === selectedSceneId) ?? video?.scenes[0];
  const result = useMemo(
    () =>
      video
        ? compileDraft(draft, video.id, surfaces)
        : { issues: [{ code: "missing_video", message: "Project has no videos.", path: "$.videos" }] },
    [draft, surfaces, video],
  );
  const changed = hasProjectChanges(project, draft);

  useEffect(() => {
    if (!sourceChanged) return;
    sourceSnapshotRef.current = baseSnapshot;
    setDraft(cloneProject(project));
    setSourceConflict(true);
    setSelectedVideoId(project.videos[0]?.id ?? "");
    setSelectedSceneId(project.videos[0]?.scenes[0]?.id ?? "");
  }, [baseSnapshot, project, sourceChanged]);

  useEffect(() => {
    if (sourceConflict || sourceChanged) return;
    try {
      window.sessionStorage.setItem(
        storageKey(project.id),
        JSON.stringify({ base: baseSnapshot, draft } satisfies StoredDraft),
      );
    } catch (error) {
      logError("draft-save-error", error);
    }
  }, [baseSnapshot, draft, project.id, sourceChanged, sourceConflict]);

  useEffect(() => {
    if (!video) return;
    if (video.id !== selectedVideoId) setSelectedVideoId(video.id);
    if (!video.scenes.some((candidate) => candidate.id === selectedSceneId))
      setSelectedSceneId(video.scenes[0]?.id ?? "");
  }, [selectedSceneId, selectedVideoId, video]);

  const reset = () => {
    const next = cloneProject(project);
    setDraft(next);
    setSourceConflict(false);
    setSelectedVideoId(next.videos[0]?.id ?? "");
    setSelectedSceneId(next.videos[0]?.scenes[0]?.id ?? "");
    setStatus("Draft reset to source project.");
    try {
      window.sessionStorage.removeItem(storageKey(project.id));
    } catch (error) {
      logError("draft-reset-error", error);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(createAgentPrompt(project, draft));
      setStatus("Agent Prompt copied.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Copy failed: ${message}`);
      logError("prompt-copy-error", error);
    }
  };

  const addScene = () => {
    if (!video) return;
    const nextScene = createScene(video);
    setDraft(replaceVideo(draft, video.id, (current) => ({ ...current, scenes: [...current.scenes, nextScene] })));
    setSelectedSceneId(nextScene.id);
  };

  const duplicateSelected = () => {
    if (!video || !scene) return;
    const nextScene = duplicateScene(video, scene);
    const index = video.scenes.findIndex((candidate) => candidate.id === scene.id);
    setDraft(
      replaceVideo(draft, video.id, (current) => ({
        ...current,
        scenes: [...current.scenes.slice(0, index + 1), nextScene, ...current.scenes.slice(index + 1)],
      })),
    );
    setSelectedSceneId(nextScene.id);
  };

  const deleteSelected = () => {
    if (!video || !scene) return;
    if (video.scenes.length === 1) {
      setStatus("A video must contain at least one scene.");
      return;
    }
    const index = video.scenes.findIndex((candidate) => candidate.id === scene.id);
    const nextScenes = video.scenes.filter((candidate) => candidate.id !== scene.id);
    setDraft(replaceVideo(draft, video.id, (current) => ({ ...current, scenes: nextScenes })));
    setSelectedSceneId(nextScenes[Math.min(index, nextScenes.length - 1)]?.id ?? "");
  };

  return (
    <div className="stagecut-devtools-studio">
      <header className="stagecut-devtools-topbar">
        <div className="stagecut-devtools-brand">
          <i />
          <div>
            <strong>Stagecut Devtools</strong>
            <small>
              {project.name} · {project.id}
            </small>
          </div>
        </div>
        <div className="stagecut-devtools-actions">
          <span className="stagecut-devtools-status" aria-live="polite">
            {status ?? (changed ? "Unsaved draft changes" : "Source project")}
          </span>
          <button className="stagecut-devtools-button" disabled={!changed} onClick={reset} type="button">
            Reset
          </button>
          <button className="stagecut-devtools-button primary" disabled={!changed} onClick={copyPrompt} type="button">
            Copy Agent Prompt
          </button>
        </div>
      </header>
      <div className="stagecut-devtools-layout">
        <aside className="stagecut-devtools-panel stagecut-devtools-sidebar">
          {sourceConflict ? (
            <div className="stagecut-devtools-notice">
              The source project changed since this tab saved its draft. The old draft was not restored.
              <button className="stagecut-devtools-button" onClick={reset} type="button">
                Start from source
              </button>
            </div>
          ) : null}
          <div className="stagecut-devtools-section">
            <div className="stagecut-devtools-label">
              <span>Video</span>
              <span>{draft.videos.length}</span>
            </div>
            <select
              aria-label="Video"
              className="stagecut-devtools-select"
              onChange={(event) => {
                const next = draft.videos.find((candidate) => candidate.id === event.currentTarget.value);
                setSelectedVideoId(event.currentTarget.value);
                setSelectedSceneId(next?.scenes[0]?.id ?? "");
              }}
              value={video?.id ?? ""}
            >
              {draft.videos.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>
          <div className="stagecut-devtools-section">
            <div className="stagecut-devtools-label">
              <span>Scenes</span>
              <span>{video?.scenes.length ?? 0}</span>
            </div>
            <div className="stagecut-devtools-scene-list">
              {video?.scenes.map((candidate) => (
                <button
                  className={`stagecut-devtools-scene${candidate.id === scene?.id ? " active" : ""}${candidate.id === draggedSceneId ? " dragging" : ""}`}
                  draggable
                  key={candidate.id}
                  onClick={() => setSelectedSceneId(candidate.id)}
                  onDragEnd={() => setDraggedSceneId(undefined)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggedSceneId(candidate.id)}
                  onDrop={() => {
                    if (!draggedSceneId || !video) return;
                    setDraft(
                      replaceVideo(draft, video.id, (current) => ({
                        ...current,
                        scenes: reorderById(current.scenes, draggedSceneId, candidate.id),
                      })),
                    );
                    setDraggedSceneId(undefined);
                  }}
                  type="button"
                >
                  <div>
                    <strong>{candidate.name ?? candidate.id}</strong>
                    <small>
                      {candidate.durationInFrames}f · {candidate.layers.length} layers
                    </small>
                  </div>
                  <span className="stagecut-devtools-scene-handle">⠿</span>
                </button>
              ))}
            </div>
            <div className="stagecut-devtools-inline-actions">
              <button className="stagecut-devtools-button" onClick={addScene} type="button">
                Add
              </button>
              <button className="stagecut-devtools-button" disabled={!scene} onClick={duplicateSelected} type="button">
                Duplicate
              </button>
              <button className="stagecut-devtools-button" disabled={!scene} onClick={deleteSelected} type="button">
                Delete
              </button>
            </div>
          </div>
        </aside>
        <main className="stagecut-devtools-workspace">
          {result.video ? (
            <Preview
              acknowledgeRemotionLicense={acknowledgeRemotionLicense}
              key={`${result.video.id}:${JSON.stringify(result.video.video)}`}
              seekSceneId={scene?.id ?? ""}
              surfaces={surfaces}
              video={result.video}
            />
          ) : (
            <div className="stagecut-devtools-preview">
              <div className="stagecut-devtools-empty">
                <strong>Draft cannot be previewed</strong>
                <ul className="stagecut-devtools-error-list">
                  {result.issues.map((issue) => (
                    <li key={`${issue.path}:${issue.code}:${issue.message}`}>
                      {issue.path} · {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
        <aside className="stagecut-devtools-panel stagecut-devtools-inspector">
          {video && scene ? (
            <SceneInspector onDraft={setDraft} project={draft} scene={scene} video={video} />
          ) : (
            <div className="stagecut-devtools-section">Select a scene to inspect it.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
