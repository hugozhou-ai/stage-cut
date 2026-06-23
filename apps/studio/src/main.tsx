import { exportAgentPrompt, exportProjectJsonString } from "@stagecut/core";
import { StagecutPlayer, useStagecutPlayerController, useStagecutPlayerState } from "@stagecut/react";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { exampleProject } from "./exampleProject";
import "./styles.css";
import { surfaceComponents } from "./surfaces";

const video = exampleProject.getVideo("studio-demo-video");
const projectJson = exportProjectJsonString(exampleProject);
const agentPrompt = exportAgentPrompt(exampleProject);

function ProjectTree() {
  return (
    <aside className="panel project-panel">
      <div>
        <p className="eyebrow">Project</p>
        <h1>{exampleProject.name}</h1>
        <p>{exampleProject.description}</p>
      </div>
      <section>
        <h2>Video</h2>
        <div className="tree-item active">
          <span>{video.id}</span>
          <small>
            {video.width}x{video.height} / {video.fps}fps
          </small>
        </div>
      </section>
      <section>
        <h2>Frames</h2>
        {video.frames.map((frame) => (
          <div className="tree-item" key={frame.id}>
            <span>{frame.id}</span>
            <small>
              {frame.surfaceId} / {frame.durationInFrames}f
            </small>
          </div>
        ))}
      </section>
      <section>
        <h2>Surfaces</h2>
        {exampleProject.surfaces.map((surface) => (
          <div className="tree-item" key={surface.id}>
            <span>{surface.id}</span>
            <small>{surface.description}</small>
          </div>
        ))}
      </section>
    </aside>
  );
}

function StudioPreview() {
  const controller = useStagecutPlayerController(video);
  const playerState = useStagecutPlayerState(controller);
  const activeFrame = video.frames.find((frame) => frame.id === playerState.activeFrameId) ?? video.frames[0];
  const progress = video.durationInFrames <= 1 ? 0 : playerState.currentFrame / (video.durationInFrames - 1);

  return (
    <main className="preview-column">
      <div className="preview-toolbar">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>{video.name}</h2>
        </div>
        <div className="toolbar-actions">
          <button onClick={(event) => controller.play(event)} type="button">
            Play
          </button>
          <button onClick={() => controller.pause()} type="button">
            Pause
          </button>
          <button onClick={() => controller.seekToFrame(0)} type="button">
            Reset
          </button>
        </div>
      </div>
      <div className="stage-shell">
        <StagecutPlayer controller={controller} surfaces={surfaceComponents} video={video} />
      </div>
      <div className="timeline-strip">
        <input
          aria-label="Timeline frame"
          max={video.durationInFrames - 1}
          min={0}
          type="range"
          value={playerState.currentFrame}
          onChange={(event) => controller.seekToFrame(Number(event.currentTarget.value))}
        />
        <div className="timeline-meta">
          <span>
            Frame {playerState.currentFrame} / {video.durationInFrames - 1}
          </span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
      </div>
      <div className="active-frame-card">
        <span className="eyebrow">Active frame</span>
        <strong>{activeFrame?.id ?? "none"}</strong>
        <code>{JSON.stringify(activeFrame?.metadata ?? {}, null, 2)}</code>
      </div>
    </main>
  );
}

function ExportPanel() {
  const [mode, setMode] = useState<"json" | "prompt">("json");
  const output = useMemo(() => (mode === "json" ? projectJson : agentPrompt), [mode]);

  return (
    <aside className="panel export-panel">
      <div>
        <p className="eyebrow">Export</p>
        <h2>Project handoff</h2>
        <p>Export the structured project or an Agent prompt for implementing this player-video in another repo.</p>
      </div>
      <div className="segmented">
        <button className={mode === "json" ? "selected" : ""} onClick={() => setMode("json")} type="button">
          JSON
        </button>
        <button className={mode === "prompt" ? "selected" : ""} onClick={() => setMode("prompt")} type="button">
          Prompt
        </button>
      </div>
      <pre>{output}</pre>
    </aside>
  );
}

function App() {
  return (
    <div className="studio-app">
      <ProjectTree />
      <StudioPreview />
      <ExportPanel />
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
