import { describe, expect, it } from "vitest";
import { compileStagecutVideo } from "./compiler";
import { defineStagecutProject, safeParseStagecutProject, serializeStagecutProject } from "./project";
import { progressForRange } from "./transitions";
import type { StagecutProjectDefinition } from "./types";
import { StagecutValidationError } from "./validation";

function createProject(overrides: Partial<StagecutProjectDefinition> = {}) {
  return defineStagecutProject({
    id: "demo-project",
    name: "Demo Project",
    schemaVersion: 1,
    stages: [{ height: 720, id: "desktop", name: "Desktop", width: 1280 }],
    surfaces: [
      { id: "background", name: "Background" },
      { id: "card", name: "Card" },
    ],
    videos: [
      {
        defaultTransition: { durationInFrames: 10, kind: "fade" },
        fps: 30,
        id: "demo",
        name: "Demo",
        scenes: [
          {
            durationInFrames: 30,
            id: "intro",
            layers: [
              { id: "intro-background", surfaceId: "background" },
              { id: "intro-card", inputProps: { title: "Intro" }, surfaceId: "card" },
            ],
          },
          {
            durationInFrames: 40,
            id: "body",
            layers: [{ id: "body-card", inputProps: { title: "Body" }, surfaceId: "card" }],
            transitionToNext: { durationInFrames: 5, kind: "slideLeft" },
          },
          {
            durationInFrames: 20,
            id: "outro",
            layers: [{ id: "outro-card", inputProps: { title: "Outro" }, surfaceId: "card" }],
          },
        ],
        stageId: "desktop",
      },
    ],
    ...overrides,
  });
}

describe("project parsing", () => {
  it("defines a deeply immutable project and round-trips JSON", () => {
    const project = createProject();
    const serialized = serializeStagecutProject(project);
    const parsed = safeParseStagecutProject(JSON.parse(serialized));

    expect(parsed.success).toBe(true);
    expect(serialized.endsWith("\n")).toBe(true);
    expect(Object.isFrozen(project.videos[0]?.scenes[0]?.layers)).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(project);
    }
  });

  it("returns structured paths for invalid external JSON", () => {
    const source = JSON.parse(serializeStagecutProject(createProject())) as Record<string, unknown>;
    const videos = source.videos as Array<Record<string, unknown>>;
    const scenes = videos[0]?.scenes as Array<Record<string, unknown>>;
    scenes[0] = { durationInFrames: 0, id: " bad ", layers: [{ id: "layer", surfaceId: "missing" }] };

    const result = safeParseStagecutProject(source);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(StagecutValidationError);
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([
          "$.videos[0].scenes[0].durationInFrames",
          "$.videos[0].scenes[0].id",
          "$.videos[0].scenes[0].layers[0].surfaceId",
        ]),
      );
    }
  });

  it("rejects duplicate ids, unknown keys, non-JSON props, and final transitions", () => {
    const source = JSON.parse(serializeStagecutProject(createProject())) as Record<string, unknown>;
    const videos = source.videos as Array<Record<string, unknown>>;
    const scenes = videos[0]?.scenes as Array<Record<string, unknown>>;
    const last = scenes.at(-1);
    if (last) {
      last.transitionToNext = { kind: "fade" };
      last.unexpected = true;
      last.layers = [
        { id: "duplicate", inputProps: { bad: undefined }, surfaceId: "card" },
        { id: "duplicate", surfaceId: "card" },
      ];
    }

    const result = safeParseStagecutProject(source);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(["duplicate_id", "invalid_json", "invalid_transition", "unknown_key"]),
      );
    }
  });

  it("canonicalizes every supported optional field and JSON value", () => {
    const project = defineStagecutProject({
      description: "Full project",
      id: "full",
      metadata: { array: [null, true, "text", 3], nested: { value: false } },
      name: "Full",
      schemaVersion: 1,
      stages: [
        {
          background: "#000",
          height: 720,
          id: "stage",
          metadata: { ratio: 1.5 },
          name: "Stage",
          width: 1280,
        },
      ],
      surfaces: [{ description: "Card", id: "card", metadata: { stable: true }, name: "Card" }],
      videos: [
        {
          clipContent: false,
          defaultTransition: { durationInFrames: 0, kind: "none" },
          description: "Video",
          fps: 60,
          id: "video",
          metadata: { version: 1 },
          name: "Video",
          playback: { autoPlay: true, controls: true, defaultStatus: "playing", loop: true },
          scenes: [
            {
              durationInFrames: 20,
              id: "scene-a",
              layers: [
                {
                  id: "layer",
                  inputProps: { array: [1, "two"], flag: true },
                  metadata: { note: null },
                  surfaceId: "card",
                },
              ],
              metadata: { scene: true },
              name: "Scene A",
              transitionToNext: { kind: "fade" },
            },
            { durationInFrames: 20, id: "scene-b", layers: [] },
          ],
          stageId: "stage",
        },
      ],
    });
    const video = compileStagecutVideo(project, "video");

    expect(video).toMatchObject({ clipContent: false, description: "Video", playback: { autoPlay: true } });
    expect(video.defaultTransition).toEqual({ durationInFrames: 0, kind: "none" });
  });

  it("reports primitive, collection, option, and reference validation failures", () => {
    const result = safeParseStagecutProject({
      description: 1,
      extra: true,
      id: 1,
      metadata: [],
      name: "",
      schemaVersion: 2,
      stages: [
        {
          background: false,
          height: 0,
          id: " stage ",
          metadata: null,
          name: 1,
          width: Number.NaN,
        },
        { height: 1, id: " stage ", name: "Duplicate", width: 1 },
      ],
      surfaces: [
        { description: 1, id: "surface", metadata: [], name: 1 },
        { id: "surface", name: "Duplicate" },
      ],
      videos: [
        {
          clipContent: "yes",
          defaultTransition: { durationInFrames: -1, kind: "invalid" },
          description: false,
          fps: 0,
          id: "video",
          metadata: { infinite: Number.POSITIVE_INFINITY },
          name: 1,
          playback: { autoPlay: 1, controls: 1, defaultStatus: "invalid", extra: true, loop: 1 },
          scenes: [
            {
              durationInFrames: 0,
              id: "scene",
              layers: [{ id: "layer", inputProps: [], metadata: "bad", surfaceId: "missing" }],
              metadata: [],
              name: 1,
            },
            { durationInFrames: 1, id: "scene", layers: "bad" },
          ],
          stageId: "missing",
        },
        { fps: 1, id: "video", name: "Duplicate", scenes: [], stageId: " stage " },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = new Set(result.error.issues.map((issue) => issue.code));
      expect(codes).toEqual(
        new Set([
          "duplicate_id",
          "invalid_id",
          "invalid_json",
          "invalid_number",
          "invalid_transition",
          "invalid_type",
          "invalid_value",
          "required",
          "unknown_key",
          "unknown_reference",
          "unsupported_schema",
        ]),
      );
    }
  });

  it("rejects non-object and non-array containers", () => {
    expect(safeParseStagecutProject(null).success).toBe(false);
    expect(
      safeParseStagecutProject({ id: "x", name: "X", schemaVersion: 1, stages: {}, surfaces: {}, videos: {} }).success,
    ).toBe(false);
    expect(
      safeParseStagecutProject({ id: "x", name: "X", schemaVersion: 1, stages: [null], surfaces: [[]], videos: [null] })
        .success,
    ).toBe(false);
  });
});

describe("video compilation", () => {
  it("compiles overlapping scene transitions and preserves layer order", () => {
    const video = compileStagecutVideo(createProject(), "demo");

    expect(video.timeline.durationInFrames).toBe(75);
    expect(video.timeline.scenes.map((scene) => [scene.scene.id, scene.startFrame, scene.endFrame])).toEqual([
      ["intro", 0, 30],
      ["body", 20, 60],
      ["outro", 55, 75],
    ]);
    expect(video.timeline.edges.map((edge) => [edge.fromSceneId, edge.toSceneId, edge.durationInFrames])).toEqual([
      ["intro", "body", 10],
      ["body", "outro", 5],
    ]);
    expect(video.timeline.scenes[0]?.scene.layers.map((layer) => layer.id)).toEqual(["intro-background", "intro-card"]);
    expect(video.getActiveSceneIndex(20)).toBe(1);
    expect(video.getRenderWindow(20).map((scene) => scene.scene.id)).toEqual(["intro", "body"]);
    expect(video.getRenderWindow(30).map((scene) => scene.scene.id)).toEqual(["body"]);
  });

  it("rejects transition ranges that consume an entire middle scene", () => {
    const project = createProject({
      videos: [
        {
          defaultTransition: { durationInFrames: 6, kind: "fade" },
          fps: 30,
          id: "demo",
          name: "Demo",
          scenes: ["a", "b", "c"].map((id) => ({ durationInFrames: 10, id, layers: [] })),
          stageId: "desktop",
        },
      ],
    });

    expect(() => compileStagecutVideo(project, "demo")).toThrow("transition ranges overlap");
  });

  it("rejects unknown videos, detached stage references, long transitions, and invalid lookup frames", () => {
    const project = createProject();
    expect(() => compileStagecutVideo(project, "missing")).toThrow('does not contain video "missing"');
    expect(() =>
      compileStagecutVideo(
        {
          ...project,
          videos: [{ ...(project.videos[0] as NonNullable<(typeof project.videos)[number]>), stageId: "missing" }],
        },
        "demo",
      ),
    ).toThrow("unknown stage");

    const tooLong = createProject({
      videos: [
        {
          defaultTransition: { durationInFrames: 11, kind: "fade" },
          fps: 30,
          id: "demo",
          name: "Demo",
          scenes: [
            { durationInFrames: 10, id: "a", layers: [] },
            { durationInFrames: 20, id: "b", layers: [] },
          ],
          stageId: "desktop",
        },
      ],
    });
    expect(() => compileStagecutVideo(tooLong, "demo")).toThrow("longer than one of its scenes");
    const video = compileStagecutVideo(project, "demo");
    expect(() => video.getRenderWindow(-1)).toThrow("must be an integer");
    expect(() => video.getActiveSceneIndex(1.5)).toThrow("must be an integer");
  });

  it("keeps render windows bounded for 500 scenes", () => {
    const project = createProject({
      videos: [
        {
          defaultTransition: { durationInFrames: 2, kind: "fade" },
          fps: 60,
          id: "stress",
          name: "Stress",
          scenes: Array.from({ length: 500 }, (_, index) => ({
            durationInFrames: 10,
            id: `scene-${index}`,
            layers: Array.from({ length: 8 }, (__, layerIndex) => ({
              id: `layer-${layerIndex}`,
              surfaceId: layerIndex % 2 === 0 ? "background" : "card",
            })),
          })),
          stageId: "desktop",
        },
      ],
    });
    const video = compileStagecutVideo(project, "stress");

    for (let frame = 0; frame < video.timeline.durationInFrames; frame += 17) {
      expect(video.getRenderWindow(frame).length).toBeLessThanOrEqual(2);
    }
  });
});

describe("transition progress", () => {
  it("reaches exact endpoints", () => {
    expect(progressForRange(0, 10)).toBe(0);
    expect(progressForRange(9, 10)).toBe(1);
    expect(progressForRange(0, 1)).toBe(1);
  });

  it("normalizes defaults and rejects invalid runtime transition input", async () => {
    const { normalizeTransition, resolveTransitionDuration } = await import("./transitions");
    expect(normalizeTransition(undefined)).toEqual({ durationInFrames: 0, kind: "none" });
    expect(normalizeTransition({ kind: "fade" })).toEqual({ durationInFrames: 15, kind: "fade" });
    expect(resolveTransitionDuration({ durationInFrames: 10, kind: "none" })).toBe(0);
    expect(() => normalizeTransition({ kind: "invalid" } as never)).toThrow("not supported");
    expect(() => normalizeTransition({ durationInFrames: -1, kind: "fade" })).toThrow("non-negative");
    expect(progressForRange(-5, 10)).toBe(0);
    expect(progressForRange(20, 10)).toBe(1);
  });
});
