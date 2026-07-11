import { serializeStagecutProject } from "@stagecut/core";
import { StagecutPlayer, useStagecutPlayerController, useStagecutPlayerState } from "@stagecut/react";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { type GalleryPageId, galleryProject, gallerySurfaces, galleryVideos } from "./galleryProject";
import "./styles.css";

const pages: Array<{ description: string; id: GalleryPageId; label: string }> = [
  { description: "Controls and deterministic frame state", id: "basic", label: "Basic Player" },
  { description: "Parallel DOM layers in sequential scenes", id: "product-tour", label: "Layered Tour" },
  { description: "Exact boundaries for built-in transitions", id: "transitions", label: "Transitions" },
  { description: "1080p60 · 500 scenes · 8 layers", id: "performance", label: "Performance Lab" },
];

function pageFromHash(): GalleryPageId {
  const id = window.location.hash.replace(/^#\/?/, "") as GalleryPageId;
  return id in galleryVideos ? id : "basic";
}

function useGalleryRoute() {
  const [pageId, setPageId] = useState<GalleryPageId>(pageFromHash);
  useEffect(() => {
    const onHashChange = () => setPageId(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return pageId;
}

function useMeasuredFps(enabled: boolean): number | null {
  const [fps, setFps] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) {
      setFps(null);
      return undefined;
    }
    let animationFrame = 0;
    let frameCount = 0;
    let startedAt = performance.now();
    const measure = (now: number) => {
      frameCount += 1;
      const elapsed = now - startedAt;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        startedAt = now;
      }
      animationFrame = requestAnimationFrame(measure);
    };
    animationFrame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled]);
  return fps;
}

function PlayerDemo({ pageId }: { pageId: GalleryPageId }) {
  const video = galleryVideos[pageId];
  const controller = useStagecutPlayerController(video);
  const state = useStagecutPlayerState(controller);
  const fps = useMeasuredFps(pageId === "performance" && state.status === "playing");
  const renderWindow = video.getRenderWindow(state.currentFrame);
  const mountedLayers = renderWindow.reduce((count, scene) => count + scene.scene.layers.length, 0);

  return (
    <section className="demo-area">
      <header className="demo-toolbar">
        <div>
          <span className="eyebrow">{pageId === "performance" ? "Instrumented example" : "Reference example"}</span>
          <h1>{video.name}</h1>
          <p>{video.description}</p>
        </div>
        <div className="controls">
          <button onClick={() => controller.play()} type="button">
            Play
          </button>
          <button onClick={() => controller.pause()} type="button">
            Pause
          </button>
          <button onClick={() => controller.seekToFrame(0)} type="button">
            Reset
          </button>
        </div>
      </header>
      <div className="player-shell">
        <StagecutPlayer acknowledgeRemotionLicense controller={controller} surfaces={gallerySurfaces} video={video} />
      </div>
      <div className="timeline">
        <input
          aria-label="Timeline frame"
          max={video.timeline.durationInFrames - 1}
          min={0}
          onChange={(event) => controller.seekToFrame(Number(event.currentTarget.value))}
          type="range"
          value={state.currentFrame}
        />
        <div className="timeline-meta">
          <span>
            Frame {state.currentFrame} / {video.timeline.durationInFrames - 1}
          </span>
          <span>{state.activeSceneId}</span>
          <span>{state.status}</span>
        </div>
      </div>
      {pageId === "performance" ? (
        <div className="metrics">
          <div>
            <strong>500</strong>
            <span>scenes</span>
          </div>
          <div>
            <strong>{renderWindow.length}</strong>
            <span>mounted scenes</span>
          </div>
          <div>
            <strong>{mountedLayers}</strong>
            <span>mounted surfaces</span>
          </div>
          <div>
            <strong>{fps ?? "—"}</strong>
            <span>browser fps</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function JsonExport() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => serializeStagecutProject(galleryProject), []);
  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stagecut-gallery.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <aside className="export-card">
      <div>
        <span className="eyebrow">Portable source</span>
        <h2>Project JSON</h2>
      </div>
      <div className="export-actions">
        <button onClick={() => setExpanded((value) => !value)} type="button">
          {expanded ? "Hide" : "View"}
        </button>
        <button onClick={copy} type="button">
          {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={download} type="button">
          Download
        </button>
      </div>
      {expanded ? (
        <pre>{json}</pre>
      ) : (
        <p>Validated schemaVersion 1 data. React components remain in the surface registry.</p>
      )}
    </aside>
  );
}

function App() {
  const pageId = useGalleryRoute();
  return (
    <div className="gallery-app">
      <aside className="sidebar">
        <a className="brand" href="#/basic">
          <span>SC</span>
          <strong>Stagecut</strong>
        </a>
        <p>High-performance Web DOM animation runtime.</p>
        <nav aria-label="Demo pages">
          {pages.map((page) => (
            <a className={page.id === pageId ? "active" : ""} href={`#/${page.id}`} key={page.id}>
              <strong>{page.label}</strong>
              <small>{page.description}</small>
            </a>
          ))}
        </nav>
        <footer>React 18/19 · SSR · Remotion adapter</footer>
      </aside>
      <main>
        <PlayerDemo key={pageId} pageId={pageId} />
        <JsonExport />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
