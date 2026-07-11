import { compileStagecutVideo, defineStagecutProject, type JsonObject } from "@stagecut/core";
import { defineSurfaceRegistry, type SurfaceComponentProps } from "@stagecut/react";

const transitionKinds = [
  "fade",
  "slideLeft",
  "slideRight",
  "slideUp",
  "slideDown",
  "zoomIn",
  "zoomOut",
  "wipeLeft",
] as const;

export const galleryProject = defineStagecutProject({
  description: "Reference projects for the Stagecut Web DOM animation runtime.",
  id: "stagecut-gallery",
  name: "Stagecut Gallery",
  schemaVersion: 1,
  stages: [
    {
      background: "linear-gradient(135deg, #09111f 0%, #17243d 52%, #07101d 100%)",
      height: 1080,
      id: "full-hd",
      name: "Full HD",
      width: 1920,
    },
  ],
  surfaces: [
    { id: "ambient", name: "Ambient background" },
    { id: "headline", name: "Headline" },
    { id: "status-card", name: "Status card" },
    { id: "annotation", name: "Annotation" },
    { id: "performance-tile", name: "Performance tile" },
  ],
  videos: [
    {
      defaultTransition: { durationInFrames: 18, kind: "fade" },
      description: "Player controls, seek, loop, and deterministic frame context.",
      fps: 60,
      id: "basic",
      name: "Basic Player",
      playback: { loop: true },
      scenes: [
        {
          durationInFrames: 90,
          id: "basic-intro",
          layers: [
            { id: "ambient", inputProps: { accent: "#7dd3fc" }, surfaceId: "ambient" },
            {
              id: "headline",
              inputProps: { eyebrow: "Runtime SDK", title: "DOM surfaces, sequenced by frames." },
              surfaceId: "headline",
            },
          ],
        },
        {
          durationInFrames: 120,
          id: "basic-state",
          layers: [
            { id: "ambient", inputProps: { accent: "#a78bfa" }, surfaceId: "ambient" },
            {
              id: "status",
              inputProps: { detail: "Pure input + frame context", title: "Deterministic rendering" },
              surfaceId: "status-card",
            },
          ],
        },
      ],
      stageId: "full-hd",
    },
    {
      defaultTransition: { durationInFrames: 24, kind: "slideUp" },
      description: "A realistic product walkthrough composed from parallel layers.",
      fps: 60,
      id: "product-tour",
      name: "Layered Product Tour",
      playback: { loop: true },
      scenes: [
        {
          durationInFrames: 120,
          id: "tour-brief",
          layers: [
            { id: "ambient", inputProps: { accent: "#38bdf8" }, surfaceId: "ambient" },
            {
              id: "headline",
              inputProps: { eyebrow: "Scene 01", title: "Compose a product story." },
              surfaceId: "headline",
            },
            {
              id: "annotation",
              inputProps: { label: "Layer 3 of 3", side: "right" },
              surfaceId: "annotation",
            },
          ],
        },
        {
          durationInFrames: 150,
          id: "tour-runtime",
          layers: [
            { id: "ambient", inputProps: { accent: "#f97316" }, surfaceId: "ambient" },
            {
              id: "status",
              inputProps: { detail: "Background + card + label", title: "Parallel layers" },
              surfaceId: "status-card",
            },
            {
              id: "annotation",
              inputProps: { label: "Shared scene timing", side: "left" },
              surfaceId: "annotation",
            },
          ],
        },
      ],
      stageId: "full-hd",
    },
    {
      description: "Every built-in scene transition rendered at exact frame boundaries.",
      fps: 60,
      id: "transitions",
      name: "Transition Catalog",
      playback: { loop: true },
      scenes: transitionKinds.map((kind, index) => ({
        durationInFrames: 72,
        id: `transition-${kind}`,
        layers: [
          { id: "ambient", inputProps: { accent: index % 2 === 0 ? "#22d3ee" : "#f97316" }, surfaceId: "ambient" },
          {
            id: "headline",
            inputProps: { eyebrow: `Transition ${index + 1}`, title: kind },
            surfaceId: "headline",
          },
        ],
        ...(index < transitionKinds.length - 1 ? { transitionToNext: { durationInFrames: 18, kind } } : {}),
      })),
      stageId: "full-hd",
    },
    {
      defaultTransition: { durationInFrames: 2, kind: "fade" },
      description: "500 scenes with eight parallel layers at 1080p60.",
      fps: 60,
      id: "performance",
      name: "Performance Lab",
      playback: { loop: true },
      scenes: Array.from({ length: 500 }, (_, sceneIndex) => ({
        durationInFrames: 10,
        id: `perf-scene-${sceneIndex}`,
        layers: Array.from({ length: 8 }, (__, layerIndex) => ({
          id: `tile-${layerIndex}`,
          inputProps: { layerIndex, sceneIndex },
          surfaceId: "performance-tile",
        })),
      })),
      stageId: "full-hd",
    },
  ],
});

function text(input: Readonly<JsonObject>, key: string, fallback = ""): string {
  const value = input[key];
  return typeof value === "string" ? value : fallback;
}

function number(input: Readonly<JsonObject>, key: string): number {
  const value = input[key];
  return typeof value === "number" ? value : 0;
}

function AmbientSurface({ input }: SurfaceComponentProps) {
  return (
    <div className="surface ambient" style={{ "--accent": text(input, "accent", "#7dd3fc") } as React.CSSProperties} />
  );
}

function HeadlineSurface({ context, input }: SurfaceComponentProps) {
  return (
    <div className="surface headline-surface">
      <div className="headline-copy" style={{ transform: `translateY(${(1 - context.progress) * 24}px)` }}>
        <span>{text(input, "eyebrow")}</span>
        <h2>{text(input, "title")}</h2>
        <small>scene frame {context.localFrame}</small>
      </div>
    </div>
  );
}

function StatusCardSurface({ context, input }: SurfaceComponentProps) {
  return (
    <div className="surface card-surface">
      <div className="demo-card">
        <span>Compiled timeline</span>
        <h2>{text(input, "title")}</h2>
        <p>{text(input, "detail")}</p>
        <div className="surface-progress">
          <i style={{ width: `${context.progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function AnnotationSurface({ input }: SurfaceComponentProps) {
  return <div className={`annotation ${text(input, "side", "right")}`}>{text(input, "label")}</div>;
}

function PerformanceTileSurface({ context, input }: SurfaceComponentProps) {
  const layerIndex = number(input, "layerIndex");
  return (
    <div
      className="performance-tile"
      style={{
        left: `${4 + (layerIndex % 4) * 24}%`,
        top: `${12 + Math.floor(layerIndex / 4) * 42}%`,
      }}
    >
      <strong>{number(input, "sceneIndex")}</strong>
      <span>
        L{layerIndex + 1} · F{context.globalFrame}
      </span>
    </div>
  );
}

export const gallerySurfaces = defineSurfaceRegistry(galleryProject, {
  ambient: AmbientSurface,
  annotation: AnnotationSurface,
  headline: HeadlineSurface,
  "performance-tile": PerformanceTileSurface,
  "status-card": StatusCardSurface,
});

export const galleryVideos = {
  basic: compileStagecutVideo(galleryProject, "basic"),
  performance: compileStagecutVideo(galleryProject, "performance"),
  "product-tour": compileStagecutVideo(galleryProject, "product-tour"),
  transitions: compileStagecutVideo(galleryProject, "transitions"),
} as const;

export type GalleryPageId = keyof typeof galleryVideos;
