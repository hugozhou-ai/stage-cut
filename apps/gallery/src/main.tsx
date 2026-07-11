import { StagecutPlayer, useStagecutPlayerController, useStagecutPlayerState } from "@stagecut/react";
import { useEffect, useState } from "react";
import stagecutLogoUrl from "./assets/stage-cut.png";
import { type GalleryPageId, gallerySurfaces, galleryVideos } from "./galleryProject";
import { GalleryIcon } from "./icons";
import "./styles.css";

const cases: Array<{ accent: string; id: GalleryPageId; index: string; label: string; summary: string }> = [
  {
    accent: "#6d7ff5",
    id: "application-dialog",
    index: "01",
    label: "Application Dialog",
    summary: "Layered desktop workflow",
  },
  {
    accent: "#6d7ff5",
    id: "message-cluster",
    index: "02",
    label: "Project Updates",
    summary: "Spatial activity choreography",
  },
  { accent: "#6d7ff5", id: "task-flow", index: "03", label: "Task Flow", summary: "Cross-functional project planning" },
];

function pageFromHash(): GalleryPageId {
  const id = window.location.hash.replace(/^#\/?/, "") as GalleryPageId;
  if (id in galleryVideos) return id;
  window.history.replaceState(null, "", "#/application-dialog");
  return "application-dialog";
}

function useGalleryRoute(): GalleryPageId {
  const [pageId, setPageId] = useState<GalleryPageId>(pageFromHash);
  useEffect(() => {
    const onHashChange = () => setPageId(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return pageId;
}

function formatTime(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const seconds = Math.floor(totalSeconds);
  const frames = frame % fps;
  return `${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

function PlayerControls({ pageId }: { pageId: GalleryPageId }) {
  const video = galleryVideos[pageId];
  const controller = useStagecutPlayerController(video);
  const state = useStagecutPlayerState(controller);
  const isPlaying = state.status === "playing";
  const activeSceneIndex = video.getActiveSceneIndex(state.currentFrame);
  const activeScene = video.timeline.scenes[activeSceneIndex];
  const renderWindow = video.getRenderWindow(state.currentFrame);

  const seekScene = (index: number) => {
    const scene = video.timeline.scenes[index];
    if (scene) controller.seekToFrame(scene.startFrame);
  };

  return (
    <>
      <section className="showcase-player">
        <div className="player-frame">
          <StagecutPlayer acknowledgeRemotionLicense controller={controller} surfaces={gallerySurfaces} video={video} />
          <div className="player-corner-label">
            <i /> LIVE DOM
          </div>
        </div>
        <div className="transport">
          <div className="transport-navigation">
            <button
              aria-label="Previous scene"
              onClick={() => seekScene(Math.max(0, activeSceneIndex - 1))}
              type="button"
            >
              <GalleryIcon name="skip-back" size={15} />
            </button>
            <button
              aria-label={isPlaying ? "Pause" : "Play"}
              className={isPlaying ? "play-button pause-button" : "play-button"}
              onClick={() => (isPlaying ? controller.pause() : controller.play())}
              type="button"
            >
              <GalleryIcon className={isPlaying ? "" : "play-icon"} name={isPlaying ? "pause" : "play"} size={14} />
            </button>
            <button
              aria-label="Next scene"
              onClick={() => seekScene(Math.min(video.timeline.scenes.length - 1, activeSceneIndex + 1))}
              type="button"
            >
              <GalleryIcon name="skip-forward" size={15} />
            </button>
          </div>
          <span className="timecode">{formatTime(state.currentFrame, video.fps)}</span>
          <input
            aria-label="Timeline frame"
            max={video.timeline.durationInFrames - 1}
            min={0}
            onChange={(event) => controller.seekToFrame(Number(event.currentTarget.value))}
            style={
              {
                "--timeline-progress": `${(state.currentFrame / (video.timeline.durationInFrames - 1)) * 100}%`,
              } as React.CSSProperties
            }
            type="range"
            value={state.currentFrame}
          />
          <span className="timecode muted">{formatTime(video.timeline.durationInFrames - 1, video.fps)}</span>
          <button
            className="restart-button"
            aria-label="Restart"
            onClick={() => controller.seekToFrame(0)}
            type="button"
          >
            <GalleryIcon name="restart" size={15} />
          </button>
        </div>
      </section>
      <section className="case-inspector">
        <div className="scene-map">
          <header>
            <span>SCENE MAP</span>
            <b>
              {video.timeline.scenes.length} scenes · {video.fps} fps
            </b>
          </header>
          <div>
            {video.timeline.scenes.map((scene, index) => (
              <button
                className={index === activeSceneIndex ? "active" : ""}
                key={scene.scene.id}
                onClick={() => seekScene(index)}
                style={{ flexGrow: scene.scene.durationInFrames }}
                title={scene.scene.name}
                type="button"
              >
                <i />
              </button>
            ))}
          </div>
          <p>
            {activeScene?.scene.name ?? "—"}
            <span>{activeScene?.scene.id ?? "—"}</span>
          </p>
        </div>
        <div className="runtime-stats">
          <header>
            <span>RUNTIME WINDOW</span>
            <i>O(log n)</i>
          </header>
          <div>
            <strong>{state.currentFrame}</strong>
            <span>global frame</span>
          </div>
          <div>
            <strong>{renderWindow.length}</strong>
            <span>mounted scenes</span>
          </div>
          <div>
            <strong>{renderWindow.reduce((sum, item) => sum + item.scene.layers.length, 0)}</strong>
            <span>DOM surfaces</span>
          </div>
          <footer>
            <i className={isPlaying ? "running" : ""} />
            {state.status}
          </footer>
        </div>
      </section>
    </>
  );
}

export function App() {
  const routedPageId = useGalleryRoute();
  const pageId = routedPageId in galleryVideos ? routedPageId : "application-dialog";
  const currentCase = cases.find((item) => item.id === pageId) ?? cases[0];
  const video = galleryVideos[pageId];
  return (
    <div className="gallery-shell">
      <aside className="gallery-sidebar">
        <a className="gallery-brand" href="#/application-dialog">
          <span>
            <img alt="" src={stagecutLogoUrl} />
          </span>
          <div>
            <b>stagecut</b>
            <small>RUNTIME GALLERY</small>
          </div>
        </a>
        <nav aria-label="Production cases">
          <div className="nav-label">PRODUCTION CASES</div>
          {cases.map((item) => (
            <a
              className={item.id === pageId ? "active" : ""}
              href={`#/${item.id}`}
              key={item.id}
              style={{ "--case-accent": item.accent } as React.CSSProperties}
            >
              <i>{item.index}</i>
              <div>
                <strong>{item.label}</strong>
                <small>{item.summary}</small>
              </div>
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <i>
            <GalleryIcon name="layers" size={15} />
          </i>
          <div>
            <b>Public API only</b>
            <span>JSON model + typed surfaces</span>
          </div>
        </div>
        <footer>
          <span>v0.5 beta</span>
          <b>React 18 / 19</b>
        </footer>
      </aside>
      <main className="gallery-main">
        <header className="gallery-header">
          <div>
            <span>CASE {currentCase?.index} / 03</span>
            <h1>{video.name}</h1>
            <p>{video.description}</p>
          </div>
          <div className="header-badges">
            <span>1440 × 900</span>
            <span>{video.fps} FPS</span>
            <span>{video.timeline.durationInFrames} FRAMES</span>
          </div>
        </header>
        <PlayerControls key={pageId} pageId={pageId} />
      </main>
    </div>
  );
}
