import { defineStagecutProject } from "@stage-cut/core";
import { defineSurfaceRegistry, StagecutRenderRoot, StagecutResource } from "@stage-cut/react-player";
import { AbsoluteFill, Audio, registerRoot } from "remotion";

function tone(frequency: number, amplitude: number) {
  const rate = 48000;
  const length = rate * 2;
  const bytes = new Uint8Array(44 + length * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++)
    view.setInt16(44 + i * 2, Math.round(Math.sin((i * frequency * Math.PI * 2) / rate) * 32767 * amplitude), true);
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return `data:audio/wav;base64,${btoa(binary)}`;
}
const bed = tone(110, 0.04),
  cue = tone(880, 0.3);
const project = defineStagecutProject({
  schemaVersion: 1,
  id: "render-qa",
  name: "Render contract",
  stages: [{ id: "s", name: "s", width: 320, height: 180 }],
  surfaces: [
    { id: "bed", name: "Bed" },
    { id: "cue", name: "Cue" },
    { id: "world", name: "Async world" },
  ],
  videos: [
    {
      id: "media-clock",
      name: "Media clock",
      stageId: "s",
      fps: 24,
      backgroundLayers: [
        { id: "world", surfaceId: "world" },
        { id: "bed", surfaceId: "bed" },
      ],
      scenes: ["a", "b"].map((id) => ({
        id,
        durationInFrames: 24,
        layers: [{ id: "cue", surfaceId: "cue", startFrame: 6, durationInFrames: 6 }],
      })),
    },
  ],
});
const surfaces = defineSurfaceRegistry(project, {
  bed: () => <Audio src={bed} />,
  cue: () => <Audio src={cue} />,
  world: ({ context }) => (
    <StagecutResource
      id="delayed-world"
      load={async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return "#14353d";
      }}
    >
      {(color) => (
        <AbsoluteFill
          style={{ background: color, color: "white", fontSize: 24, justifyContent: "center", alignItems: "center" }}
        >
          FRAME {context.globalFrame}
        </AbsoluteFill>
      )}
    </StagecutResource>
  ),
});
registerRoot(() => <StagecutRenderRoot project={project} surfaces={surfaces} />);
