import { compileStagecutVideo, defineStagecutProject } from "@stage-cut/core";
import { defineSurfaceRegistry, type SurfaceComponentProps } from "@stage-cut/react-player";
import { Audio, staticFile } from "remotion";
import { GrottoSurface } from "./GrottoSurface";

const fps = 24;
export const duration = 48;
export const captions = [
  { start: 5.0, end: 9.7, zh: "向内而行，把黑暗留给远方。", en: "Walk inward. Leave the darkness in the distance." },
  {
    start: 13.3,
    end: 18.9,
    zh: "一盏灯，让壁上的千年醒来。",
    en: "One small light awakens a thousand years of colour.",
  },
  {
    start: 24.6,
    end: 30.7,
    zh: "镜中无尽，照见的也是此刻。",
    en: "Within endless reflections, this moment looks back.",
  },
  { start: 36.0, end: 41.7, zh: "让每一粒微尘，都成为星河。", en: "Let every mote of dust become a constellation." },
];
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const fade = (frame: number, durationInFrames: number, seconds = 0.7) =>
  Math.min(clamp(frame / (fps * seconds)), clamp((durationInFrames - 1 - frame) / (fps * seconds)));
function Caption({ context, input }: SurfaceComponentProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 37,
        left: 160,
        right: 160,
        textAlign: "center",
        opacity: fade(context.localFrame, context.durationInFrames),
        color: "#eee1cb",
      }}
    >
      <div style={{ fontFamily: "Grotto Serif", fontSize: 27, letterSpacing: 4 }}>{String(input.zh)}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 17, letterSpacing: 1, color: "#a89c87", marginTop: 9 }}>
        {String(input.en)}
      </div>
    </div>
  );
}
function Titles({ context }: SurfaceComponentProps) {
  const t = context.globalFrame / fps;
  const opening = clamp((t - 1.7) / 1.5) * (1 - clamp((t - 7.2) / 1.4));
  const ending = clamp((t - 43) / 1.8);
  const chapter = t < 12 ? "01 / 入窟" : t < 23 ? "02 / 壁上千年" : t < 35 ? "03 / 镜中无尽" : "04 / 微尘有光";
  return (
    <div style={{ position: "absolute", inset: 0, color: "#e6d3b1" }}>
      <div
        style={{ position: "absolute", top: 45, left: 100, fontFamily: "Grotto Serif", fontSize: 19, letterSpacing: 5 }}
      >
        一灯入微{" "}
        <span style={{ fontFamily: "Georgia", fontSize: 12, letterSpacing: 3, marginLeft: 16, color: "#9a8b72" }}>
          A LIGHT WITHIN
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 47,
          right: 100,
          fontFamily: "Grotto Serif",
          fontSize: 14,
          letterSpacing: 3,
          color: "#b1a28b",
        }}
      >
        {chapter}
      </div>
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 150,
          opacity: opening,
          transform: `translateY(${(1 - opening) * 14}px)`,
        }}
      >
        <div style={{ fontFamily: "Georgia", fontSize: 13, letterSpacing: 8, marginBottom: 22, color: "#c2a16d" }}>
          A JOURNEY INTO STILLNESS
        </div>
        <div style={{ fontFamily: "Grotto Serif", fontSize: 90, letterSpacing: 17, textShadow: "0 2px 30px #000" }}>
          一灯入微
        </div>
        <div style={{ width: 55, height: 1, background: "#a5844a", marginTop: 30, marginBottom: 22 }} />
        <div style={{ fontFamily: "Georgia", fontSize: 20, letterSpacing: 6 }}>A LIGHT WITHIN</div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: ending,
        }}
      >
        <div style={{ fontFamily: "Grotto Serif", fontSize: 74, letterSpacing: 20 }}>微尘有光</div>
        <div style={{ fontFamily: "Georgia", fontSize: 16, letterSpacing: 7, marginTop: 24, color: "#b59a6b" }}>
          THE INFINITE, WITHIN.
        </div>
        <div style={{ fontFamily: "Georgia", fontSize: 11, letterSpacing: 4, marginTop: 54, color: "#7d786d" }}>
          AN ORIGINAL GENERATIVE FILM · STAGECUT
        </div>
      </div>
    </div>
  );
}
function Score() {
  return <Audio src={staticFile("score.wav")} volume={0.34} />;
}

function Narration({ input }: SurfaceComponentProps) {
  return <Audio src={staticFile(`voice-${String(input.index)}.mp3`)} volume={1} />;
}

export const project = defineStagecutProject({
  schemaVersion: 1,
  id: "one-lamp-project",
  name: "一灯入微 · A Light Within",
  stages: [{ id: "cinema", name: "1920×1080", width: 1920, height: 1080, background: "#060809" }],
  surfaces: [
    { id: "world", name: "Persistent WebGL grotto" },
    { id: "titles", name: "Editorial typography" },
    { id: "caption", name: "Bilingual captions" },
    { id: "score", name: "Persistent original soundscape" },
    { id: "voice", name: "Mandarin narration" },
  ],
  videos: [
    {
      id: "one-lamp",
      name: "一灯入微",
      stageId: "cinema",
      fps,
      backgroundLayers: [
        { id: "grotto", surfaceId: "world" },
        { id: "soundscape", surfaceId: "score" },
      ],
      scenes: [
        { id: "enter", durationInFrames: 12 * fps, layers: [] },
        { id: "mural", durationInFrames: 11 * fps, layers: [] },
        { id: "mirror", durationInFrames: 12 * fps, layers: [] },
        { id: "release", durationInFrames: 13 * fps, layers: [] },
      ],
      overlayLayers: [
        { id: "titles", surfaceId: "titles" },
        ...captions.map((caption, index) => ({
          id: `voice-${index}`,
          surfaceId: "voice",
          startFrame: Math.round(caption.start * fps),
          durationInFrames: Math.round((caption.end - caption.start) * fps),
          inputProps: { index },
        })),
        ...captions.map((caption, index) => ({
          id: `caption-${index}`,
          surfaceId: "caption",
          startFrame: Math.round(caption.start * fps),
          durationInFrames: Math.round((caption.end - caption.start) * fps),
          inputProps: { zh: caption.zh, en: caption.en },
        })),
      ],
    },
  ],
});
export const surfaces = defineSurfaceRegistry(project, {
  world: GrottoSurface,
  titles: Titles,
  caption: Caption,
  score: Score,
  voice: Narration,
});
export const video = compileStagecutVideo(project, "one-lamp");
