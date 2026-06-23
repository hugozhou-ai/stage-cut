import { describe, expect, it } from "vitest";
import { exportAgentPrompt, exportProjectJsonString } from "./exporters";
import { PlayerVideo } from "./PlayerVideo";
import { StagecutProject } from "./StagecutProject";
import { VideoFrame } from "./VideoFrame";

function createFrame(id: string, durationInFrames = 30, surfaceId = "dialog") {
  return new VideoFrame({
    durationInFrames,
    id,
    inputProps: { title: id },
    surfaceId,
  }).toJSON();
}

function createVideo() {
  return new PlayerVideo({
    fps: 30,
    frames: [createFrame("intro", 30), createFrame("body", 40), createFrame("outro", 20)],
    height: 720,
    id: "demo",
    name: "Demo",
    stageId: "desktop",
    transition: { durationInFrames: 10, kind: "fade" },
    width: 1280,
  });
}

function createProject() {
  return new StagecutProject({
    id: "demo-project",
    name: "Demo Project",
    stages: [{ height: 720, id: "desktop", name: "Desktop", width: 1280 }],
    surfaces: [{ description: "A dialog surface", id: "dialog", name: "Dialog" }],
    videos: [createVideo().toJSON()],
  });
}

describe("VideoFrame", () => {
  it("rejects missing ids and invalid durations", () => {
    expect(() => createFrame("")).toThrow("id is required");
    expect(() => createFrame("bad", 0)).toThrow("durationInFrames must be a positive integer");
  });

  it("normalizes single transition configs into in/out overrides", () => {
    const frame = new VideoFrame({
      durationInFrames: 12,
      id: "with-transition",
      surfaceId: "dialog",
      transition: { durationInFrames: 4, kind: "fade" },
    });

    expect(frame.transition).toEqual({
      in: { durationInFrames: 4, kind: "fade" },
      out: { durationInFrames: 4, kind: "fade" },
    });
  });
});

describe("PlayerVideo", () => {
  it("rejects invalid video dimensions, empty frames, and duplicate frames", () => {
    expect(
      () =>
        new PlayerVideo({
          fps: 30,
          frames: [],
          height: 720,
          id: "empty",
          name: "Empty",
          stageId: "desktop",
          width: 1280,
        }),
    ).toThrow("requires at least one frame");

    expect(
      () =>
        new PlayerVideo({
          fps: 30,
          frames: [createFrame("same"), createFrame("same")],
          height: 720,
          id: "duplicate",
          name: "Duplicate",
          stageId: "desktop",
          width: 1280,
        }),
    ).toThrow('duplicate id "same"');

    expect(
      () =>
        new PlayerVideo({
          fps: 0,
          frames: [createFrame("ok")],
          height: 720,
          id: "bad-fps",
          name: "Bad FPS",
          stageId: "desktop",
          width: 1280,
        }),
    ).toThrow("fps must be a positive integer");
  });

  it("computes overlapping transition timelines", () => {
    const video = createVideo();

    expect(video.durationInFrames).toBe(70);
    expect(video.timeline.items.map((item) => [item.frameId, item.startFrame, item.endFrame])).toEqual([
      ["intro", 0, 30],
      ["body", 20, 60],
      ["outro", 50, 70],
    ]);
    expect(video.timeline.edges.map((edge) => [edge.fromFrameId, edge.toFrameId, edge.durationInFrames])).toEqual([
      ["intro", "body", 10],
      ["body", "outro", 10],
    ]);
    expect(video.getActiveFrameId(19)).toBe("intro");
    expect(video.getActiveFrameId(20)).toBe("body");
    expect(video.getActiveFrameId(50)).toBe("outro");
  });

  it("uses frame edge transition overrides before video defaults", () => {
    const video = new PlayerVideo({
      fps: 30,
      frames: [
        new VideoFrame({
          durationInFrames: 30,
          id: "a",
          surfaceId: "dialog",
          transition: { out: { durationInFrames: 6, kind: "slideLeft" } },
        }).toJSON(),
        createFrame("b", 30),
      ],
      height: 720,
      id: "overrides",
      name: "Overrides",
      stageId: "desktop",
      transition: { durationInFrames: 10, kind: "fade" },
      width: 1280,
    });

    expect(video.timeline.edges[0]?.transition.kind).toBe("slideLeft");
    expect(video.timeline.edges[0]?.durationInFrames).toBe(6);
    expect(video.durationInFrames).toBe(54);
  });

  it("rejects overlapping transition ranges inside a frame", () => {
    expect(
      () =>
        new PlayerVideo({
          fps: 30,
          frames: [createFrame("a", 10), createFrame("b", 10), createFrame("c", 10)],
          height: 720,
          id: "bad-overlap",
          name: "Bad Overlap",
          stageId: "desktop",
          transition: { durationInFrames: 6, kind: "fade" },
          width: 1280,
        }),
    ).toThrow("transition ranges overlap");
  });
});

describe("StagecutProject", () => {
  it("round-trips project JSON", () => {
    const project = createProject();
    const json = project.toJSON();
    const restored = StagecutProject.fromJSON(json);

    expect(restored.toJSON()).toEqual(json);
    expect(JSON.parse(exportProjectJsonString(restored))).toEqual(json);
  });

  it("rejects unknown stage and surface references", () => {
    expect(
      () =>
        new StagecutProject({
          id: "bad-stage",
          name: "Bad Stage",
          stages: [{ height: 720, id: "desktop", name: "Desktop", width: 1280 }],
          surfaces: [{ id: "dialog", name: "Dialog" }],
          videos: [{ ...createVideo().toJSON(), stageId: "missing" }],
        }),
    ).toThrow('unknown stage "missing"');

    expect(
      () =>
        new StagecutProject({
          id: "bad-surface",
          name: "Bad Surface",
          stages: [{ height: 720, id: "desktop", name: "Desktop", width: 1280 }],
          surfaces: [{ id: "dialog", name: "Dialog" }],
          videos: [{ ...createVideo().toJSON(), frames: [createFrame("intro", 30, "missing")] }],
        }),
    ).toThrow('unknown surface "missing"');
  });

  it("exports an agent prompt with the project structure", () => {
    const prompt = exportAgentPrompt(createProject());

    expect(prompt).toContain("Stagecut player-video project");
    expect(prompt).toContain('surface "dialog"');
    expect(prompt).toContain('"schemaVersion": 1');
  });
});
