import { defineStagecutProject, type SceneDefinition } from "@stagecut/core";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cloneProject,
  createAgentPrompt,
  createChangeOperations,
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
import { StagecutDevtools } from "./StagecutDevtools";

const controller = {
  pause: vi.fn(),
  play: vi.fn(),
  seekToFrame: vi.fn(),
  stepByFrames: vi.fn(),
};

vi.mock("@stagecut/react-player", () => ({
  StagecutPlayer: ({ video }: { video: { id: string } }) => <div data-testid="player">{video.id}</div>,
  useStagecutPlayerController: () => controller,
  useStagecutPlayerState: () => ({
    currentFrame: 0,
    isReady: true,
    lastError: null,
    status: "paused",
  }),
}));

function createProject(sceneCount = 2) {
  return defineStagecutProject({
    id: "devtools-fixture",
    name: "Devtools Fixture",
    schemaVersion: 1,
    stages: [{ height: 360, id: "stage", name: "Stage", width: 640 }],
    surfaces: [{ id: "title", name: "Title" }],
    videos: [
      {
        fps: 30,
        id: "demo",
        name: "Demo",
        scenes: Array.from({ length: sceneCount }, (_, index) => ({
          durationInFrames: 30,
          id: `scene-${index + 1}`,
          layers: [
            {
              id: `layer-${index + 1}`,
              inputProps: { text: `Scene ${index + 1}` },
              surfaceId: "title",
            },
          ],
          name: `Scene ${index + 1}`,
          ...(index === 0 && sceneCount > 1
            ? { transitionToNext: { durationInFrames: 5, kind: "fade" as const } }
            : {}),
        })),
        stageId: "stage",
      },
    ],
  });
}

const surfaces = { title: () => <div>Title</div> };

beforeEach(() => {
  window.history.replaceState(null, "", "/preview");
  window.sessionStorage.clear();
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(cleanup);

describe("draft operations", () => {
  it("keeps the source immutable and emits semantic scene, layer, and ordering changes", () => {
    const source = createProject();
    const cloned = cloneProject(source);
    let draft = replaceScene(cloned, "demo", "scene-1", (scene) => ({ ...scene, durationInFrames: 42 }));
    draft = updateLayerInput(draft, "demo", "scene-1", "layer-1", { text: "Changed" });
    draft = replaceVideo(draft, "demo", (video) => ({
      ...video,
      scenes: reorderById(video.scenes, "scene-2", "scene-1"),
    }));

    const operations = createChangeOperations(source, draft);
    expect(operations.map((operation) => operation.type)).toEqual([
      "change-scene-duration",
      "change-layer-input",
      "reorder-scenes",
    ]);
    expect(source.videos[0]?.scenes[0]?.durationInFrames).toBe(30);
    expect(hasProjectChanges(source, draft)).toBe(true);
    expect(createAgentPrompt(source, draft)).toContain('"sceneId": "scene-1"');
    expect(createAgentPrompt(source, draft)).toContain('"before": 30');
  });

  it("creates valid unique scenes and leaves unknown reorder requests unchanged", () => {
    const project = createProject();
    const video = project.videos[0];
    expect(video).toBeDefined();
    expect(createScene(video as NonNullable<typeof video>)).toMatchObject({ durationInFrames: 30, id: "scene" });
    expect(reorderById(video?.scenes ?? [], "unknown", "scene-1")).toEqual(video?.scenes);
  });

  it("covers scene duplication, layer creation, movement, transitions, additions, and removals", () => {
    const source = createProject();
    const video = source.videos[0];
    const scene = video?.scenes[0];
    expect(video && scene).toBeTruthy();
    const duplicate = duplicateScene(video as NonNullable<typeof video>, scene as NonNullable<typeof scene>);
    const layer = createLayer(scene as NonNullable<typeof scene>, "title");
    expect(duplicate.id).toBe("scene-1-copy");
    expect(layer.id).toBe("layer");
    expect(moveByOffset(["a", "b"], 0, 1)).toEqual(["b", "a"]);
    expect(moveByOffset(["a"], 0, -1)).toEqual(["a"]);

    let draft = updateTransition(source, "demo", "scene-1", { durationInFrames: 8, kind: "slideLeft" });
    draft = replaceVideo(draft, "demo", (current) => ({
      ...current,
      scenes: [current.scenes[0] as SceneDefinition, duplicate],
    }));
    const types = createChangeOperations(source, draft).map((operation) => operation.type);
    expect(types).toContain("change-scene-transition");
    expect(types).toContain("remove-scene");
    expect(types).toContain("add-scene");
  });
});

describe("StagecutDevtools entry", () => {
  it("renders nothing on the server, when disabled, or without the query parameter", () => {
    const project = createProject();
    expect(renderToString(<StagecutDevtools enabled project={project} surfaces={surfaces} />)).toBe("");
    const disabled = render(<StagecutDevtools enabled={false} project={project} surfaces={surfaces} />);
    expect(disabled.container.innerHTML).toBe("");
    disabled.unmount();
    render(<StagecutDevtools enabled project={project} surfaces={surfaces} />);
    expect(screen.queryByLabelText("Open Stagecut Devtools")).toBeNull();
  });

  it("shows the launcher and opens a studio URL while preserving host URL state", async () => {
    window.history.replaceState(null, "", "/preview?foo=bar&stagecut#/case");
    const opened = { opener: window };
    const open = vi.spyOn(window, "open").mockReturnValue(opened as unknown as Window);
    render(<StagecutDevtools enabled project={createProject()} surfaces={surfaces} />);

    const launcher = await screen.findByLabelText("Open Stagecut Devtools");
    fireEvent.click(launcher);
    expect(open).toHaveBeenCalledOnce();
    const target = new URL(String(open.mock.calls[0]?.[0]));
    expect(target.pathname).toBe("/preview");
    expect(target.searchParams.get("foo")).toBe("bar");
    expect(target.searchParams.get("stagecut")).toBe("studio");
    expect(target.hash).toBe("#/case");
    expect(opened.opener).toBeNull();
  });

  it("reports a blocked studio tab", async () => {
    window.history.replaceState(null, "", "/preview?stagecut");
    vi.spyOn(window, "open").mockReturnValue(null);
    render(<StagecutDevtools enabled project={createProject()} surfaces={surfaces} />);
    fireEvent.click(await screen.findByLabelText("Open Stagecut Devtools"));
    expect((await screen.findByRole("alert")).textContent).toContain("blocked");
  });

  it("supports a custom activation query parameter", async () => {
    window.history.replaceState(null, "", "/preview?inspect");
    render(<StagecutDevtools enabled project={createProject()} queryParam="inspect" surfaces={surfaces} />);
    expect(await screen.findByLabelText("Open Stagecut Devtools")).toBeTruthy();
  });
});

describe("Studio workflow", () => {
  beforeEach(() => window.history.replaceState(null, "", "/preview?stagecut=studio"));

  it("previews valid edits, blocks invalid drafts, resets, and copies a change prompt", async () => {
    render(<StagecutDevtools enabled project={createProject()} surfaces={surfaces} />);
    expect((await screen.findByTestId("player")).textContent).toContain("demo");

    const duration = screen.getByLabelText("Duration in frames");
    fireEvent.change(duration, { target: { value: "0" } });
    expect(await screen.findByText("Draft cannot be previewed")).toBeTruthy();
    expect(screen.getByText(/durationInFrames/)).toBeTruthy();

    fireEvent.change(duration, { target: { value: "45" } });
    expect(await screen.findByTestId("player")).toBeTruthy();
    const copy = screen.getByRole("button", { name: "Copy Agent Prompt" });
    expect((copy as HTMLButtonElement).disabled).toBe(false);
    await act(async () => fireEvent.click(copy));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('"after": 45'));

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect((screen.getByLabelText("Duration in frames") as HTMLInputElement).value).toBe("30");
    expect((copy as HTMLButtonElement).disabled).toBe(true);
  });

  it("supports scene creation, duplication, deletion protection, and JSON input errors", async () => {
    render(<StagecutDevtools enabled project={createProject(1)} surfaces={surfaces} />);
    await screen.findByTestId("player");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("A video must contain at least one scene.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("New scene")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(screen.getByText("New scene copy")).toBeTruthy();

    fireEvent.click(screen.getByText("Scene 1"));
    const input = screen.getByLabelText("Layer inputProps JSON");
    fireEvent.change(input, { target: { value: "[invalid" } });
    fireEvent.blur(input);
    expect(await screen.findByText(/Unexpected token|Expected property name/)).toBeTruthy();
  });

  it("does not restore a session draft based on changed source", async () => {
    const project = createProject();
    window.sessionStorage.setItem(
      "stagecut:devtools:devtools-fixture",
      JSON.stringify({ base: "old source", draft: project }),
    );
    render(<StagecutDevtools enabled project={project} surfaces={surfaces} />);
    expect(await screen.findByText(/source project changed/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start from source" }));
    await waitFor(() => expect(screen.queryByText(/source project changed/)).toBeNull());
  });

  it("restores a valid session draft and reports clipboard failures", async () => {
    const project = createProject();
    const draft = replaceScene(project, "demo", "scene-1", (scene) => ({ ...scene, durationInFrames: 44 }));
    window.sessionStorage.setItem(
      "stagecut:devtools:devtools-fixture",
      JSON.stringify({ base: JSON.stringify(project), draft }),
    );
    const clipboardError = new Error("permission denied");
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(clipboardError);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<StagecutDevtools enabled project={project} surfaces={surfaces} />);
    expect(((await screen.findByLabelText("Duration in frames")) as HTMLInputElement).value).toBe("44");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy Agent Prompt" })));
    expect(screen.getByText("Copy failed: permission denied")).toBeTruthy();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('"event":"prompt-copy-error"'));
  });

  it("edits transitions and layers and reorders scenes by drag and drop", async () => {
    const project = replaceScene(createProject(), "demo", "scene-1", (scene) => ({
      ...scene,
      layers: [...scene.layers, { id: "second-layer", inputProps: { text: "Second" }, surfaceId: "title" }],
    }));
    render(<StagecutDevtools enabled project={project} surfaces={surfaces} />);
    await screen.findByTestId("player");

    fireEvent.change(screen.getByDisplayValue("fade"), { target: { value: "slideLeft" } });
    fireEvent.change(screen.getByLabelText("Transition frames"), { target: { value: "7" } });
    const jsonEditors = screen.getAllByLabelText("Layer inputProps JSON");
    fireEvent.change(jsonEditors[0] as HTMLElement, { target: { value: '{"text":"Edited"}' } });
    fireEvent.blur(jsonEditors[0] as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Move second-layer up" }));
    fireEvent.click(screen.getByRole("button", { name: "Add layer" }));

    const sceneTwo = screen.getByText("Scene 2").closest("button") as HTMLButtonElement;
    const sceneOne = screen.getByText("Scene 1").closest("button") as HTMLButtonElement;
    fireEvent.dragStart(sceneTwo);
    fireEvent.dragOver(sceneOne);
    fireEvent.drop(sceneOne);
    expect((screen.getByRole("button", { name: "Copy Agent Prompt" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("detects a source project change without requiring a page reload", async () => {
    const project = createProject();
    const view = render(<StagecutDevtools enabled project={project} surfaces={surfaces} />);
    await screen.findByTestId("player");
    const changedSource = replaceScene(project, "demo", "scene-1", (scene) => ({ ...scene, durationInFrames: 40 }));
    view.rerender(<StagecutDevtools enabled project={changedSource} surfaces={surfaces} />);
    expect(await screen.findByText(/source project changed/)).toBeTruthy();
    expect((screen.getByLabelText("Duration in frames") as HTMLInputElement).value).toBe("40");
  });

  it("shows missing Surface registrations as a structured preview error", async () => {
    render(<StagecutDevtools enabled project={createProject()} surfaces={{}} />);
    expect(await screen.findByText(/not registered/)).toBeTruthy();
  });
});
