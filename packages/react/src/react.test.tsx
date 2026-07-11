import { compileStagecutVideo, defineStagecutProject, type TransitionName } from "@stage-cut/core";
import { act, render, renderHook, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStagecutPlayerController, useStagecutPlayerPlaybackState, useStagecutPlayerState } from "./hooks";
import { defineSurfaceRegistry } from "./registry";
import { StagecutComposition } from "./StagecutComposition";
import { StagecutPlayer } from "./StagecutPlayer";
import { StagecutPlayerService } from "./StagecutPlayerService";
import { resolveTransitionStyle } from "./transitionStyles";
import type { FrameRenderContext } from "./types";

const remotionState = vi.hoisted(() => ({ frame: 0 }));
const playerState = vi.hoisted(() => ({
  frame: 0,
  listeners: new Map<string, Set<(event?: unknown) => void>>(),
  pause: vi.fn(),
  play: vi.fn(),
  playing: false,
  props: {} as Record<string, unknown>,
  seekTo: vi.fn(),
}));

vi.mock("remotion", () => ({
  AbsoluteFill: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <div data-testid="absolute-fill" style={style}>
      {children}
    </div>
  ),
  useCurrentFrame: () => remotionState.frame,
}));

vi.mock("@remotion/player", async () => {
  const React = await import("react");
  return {
    Player: React.forwardRef((props: Record<string, unknown>, ref) => {
      playerState.props = props;
      React.useImperativeHandle(ref, () => ({
        addEventListener: (name: string, listener: (event?: unknown) => void) => {
          const listeners = playerState.listeners.get(name) ?? new Set();
          listeners.add(listener);
          playerState.listeners.set(name, listeners);
        },
        getCurrentFrame: () => playerState.frame,
        isPlaying: () => playerState.playing,
        pause: playerState.pause,
        play: playerState.play,
        removeEventListener: (name: string, listener: (event?: unknown) => void) => {
          playerState.listeners.get(name)?.delete(listener);
        },
        seekTo: playerState.seekTo,
      }));
      return (
        <div
          className={props.className as string}
          data-testid="mock-remotion-player"
          style={props.style as React.CSSProperties}
        />
      );
    }),
  };
});

function emit(name: string, event?: unknown) {
  for (const listener of playerState.listeners.get(name) ?? []) {
    listener(event);
  }
}

function createRuntime() {
  const project = defineStagecutProject({
    id: "demo-project",
    name: "Demo",
    schemaVersion: 1,
    stages: [{ background: "#123456", height: 720, id: "desktop", name: "Desktop", width: 1280 }],
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
              { id: "intro-background", inputProps: { label: "Backdrop" }, surfaceId: "background" },
              { id: "intro-card", inputProps: { title: "Intro" }, surfaceId: "card" },
            ],
          },
          {
            durationInFrames: 30,
            id: "outro",
            layers: [{ id: "outro-card", inputProps: { title: "Outro" }, surfaceId: "card" }],
          },
        ],
        stageId: "desktop",
      },
    ],
  });
  const Background = ({ input }: { context: FrameRenderContext; input: { label: string } }) => <div>{input.label}</div>;
  const Card = ({ context, input }: { context: FrameRenderContext; input: { title: string } }) => (
    <div>
      {context.sceneId}:{input.title}:{context.layerId}:{context.fps}
    </div>
  );
  const surfaces = defineSurfaceRegistry(project, { background: Background, card: Card });
  return { project, surfaces, video: compileStagecutVideo(project, "demo") };
}

function createFakePlayer(currentFrame = 0, initiallyPlaying = false) {
  let frame = currentFrame;
  let playing = initiallyPlaying;
  const play = vi.fn(() => {
    playing = true;
  });
  const pause = vi.fn(() => {
    playing = false;
  });
  const seekTo = vi.fn((nextFrame: number) => {
    frame = nextFrame;
  });
  return { getCurrentFrame: () => frame, isPlaying: () => playing, pause, play, seekTo };
}

beforeEach(() => {
  remotionState.frame = 0;
  playerState.frame = 0;
  playerState.listeners.clear();
  playerState.pause.mockReset();
  playerState.play.mockReset();
  playerState.playing = false;
  playerState.props = {};
  playerState.seekTo.mockReset();
});

describe("surface registry", () => {
  it("freezes exact registrations and rejects missing, extra, and video-missing surfaces", () => {
    const { project, surfaces, video } = createRuntime();
    expect(Object.isFrozen(surfaces)).toBe(true);
    expect(() => defineSurfaceRegistry(project, { card: () => null } as never)).toThrow("does not match");
    expect(() => defineSurfaceRegistry(project, { ...surfaces, extra: () => null } as never)).toThrow("does not match");
    expect(() => render(<StagecutPlayer surfaces={{ card: () => null }} video={video} />)).toThrow(
      "missing registered surfaces",
    );
  });

  it("allows declared surfaces that are not used by the current timeline", () => {
    const project = defineStagecutProject({
      id: "unused-surface-project",
      name: "Unused surface project",
      schemaVersion: 1,
      stages: [{ height: 100, id: "stage", name: "Stage", width: 100 }],
      surfaces: [{ id: "future", name: "Future" }],
      videos: [
        {
          fps: 30,
          id: "empty-layer-video",
          name: "Empty layer video",
          scenes: [{ durationInFrames: 10, id: "scene", layers: [] }],
          stageId: "stage",
        },
      ],
    });

    const registry = defineSurfaceRegistry(project, {
      future: ({ input }) => <div>{String(input.label ?? "future")}</div>,
    });
    expect(Object.keys(registry)).toEqual(["future"]);
  });
});

describe("StagecutComposition", () => {
  it("keeps surfaces deterministic by default and explicitly enables active-scene interaction", () => {
    const { surfaces, video } = createRuntime();
    const deterministic = render(<StagecutComposition surfaces={surfaces} video={video} />);
    expect(screen.getAllByTestId("absolute-fill")[0]?.style.pointerEvents).toBe("none");
    deterministic.unmount();

    const interactive = render(<StagecutComposition interactive surfaces={surfaces} video={video} />);
    for (const element of screen.getAllByTestId("absolute-fill")) {
      expect(element.style.pointerEvents).toBe("auto");
    }
    interactive.unmount();

    remotionState.frame = 20;
    const transition = render(<StagecutComposition interactive surfaces={surfaces} video={video} />);
    const composition = screen.getAllByTestId("absolute-fill")[0];
    const scenes = Array.from(composition?.children ?? []) as HTMLElement[];
    expect(scenes.map((scene) => scene.style.pointerEvents)).toEqual(["none", "auto"]);
    transition.unmount();
  });
});

describe("StagecutPlayerService", () => {
  it("synchronizes active scene when attaching at a non-zero frame", () => {
    const { video } = createRuntime();
    const service = new StagecutPlayerService(video);
    service.attachPlayer(createFakePlayer(25, true));
    expect(service.getState()).toMatchObject({
      activeSceneId: "outro",
      currentFrame: 25,
      isReady: true,
      status: "playing",
    });
    expect(service.getCurrentFrame()).toBe(25);
    expect(service.getPlaybackState()).toMatchObject({ isReady: true, status: "playing" });
  });

  it("keeps playback subscribers out of frame-only updates and deduplicates repeats", () => {
    const service = new StagecutPlayerService(createRuntime().video);
    const frameListener = vi.fn();
    const playbackListener = vi.fn();
    const unsubscribeFrame = service.subscribe(frameListener);
    const unsubscribePlayback = service.subscribePlayback(playbackListener);
    const player = createFakePlayer();
    service.attachPlayer(player);
    frameListener.mockClear();
    playbackListener.mockClear();
    service.setCurrentFrame(20);
    service.setCurrentFrame(20);
    expect(frameListener).toHaveBeenCalledTimes(1);
    expect(playbackListener).not.toHaveBeenCalled();
    service.detachPlayer(createFakePlayer());
    expect(service.getState().isReady).toBe(true);
    service.detachPlayer(player);
    expect(service.getState()).toMatchObject({ isReady: false, status: "idle" });
    unsubscribeFrame();
    unsubscribePlayback();
  });

  it("supports the complete playback state machine and command surface", () => {
    const service = new StagecutPlayerService(createRuntime().video);
    const player = createFakePlayer();
    service.attachPlayer(player);
    service.markBuffering();
    expect(service.getState().status).toBe("buffering");
    service.markPaused();
    service.markPlaying();
    service.markError(new Error("broken"));
    expect(service.getState()).toMatchObject({ lastError: "broken", status: "error" });
    service.markResumed();
    expect(service.getState()).toMatchObject({ lastError: null, status: "paused" });
    service.toggle();
    expect(player.play).toHaveBeenCalled();
    service.markPlaying();
    service.toggle();
    expect(player.pause).toHaveBeenCalled();
    service.pause();
    service.seekToSeconds(1);
    expect(player.seekTo).toHaveBeenCalledWith(30);
    service.stepByFrames(-5);
    expect(service.getCurrentFrame()).toBe(25);
    service.stepByFrames(-100);
    expect(service.getCurrentFrame()).toBe(0);
    service.stepByFrames(1000);
    expect(service.getCurrentFrame()).toBe(service.video.timeline.durationInFrames - 1);
    service.markEnded();
    service.markPaused();
    expect(service.getState().status).toBe("ended");
    player.seekTo.mockClear();
    service.play();
    expect(player.seekTo).toHaveBeenCalledWith(0);
  });

  it("resumes from a user seek after ending and rejects invalid commands", () => {
    const service = new StagecutPlayerService(createRuntime().video);
    const player = createFakePlayer();
    service.attachPlayer(player);
    service.markEnded();
    service.seekToFrame(20);
    player.seekTo.mockClear();
    service.play();
    expect(player.seekTo).not.toHaveBeenCalledWith(0);
    expect(service.getState()).toMatchObject({ activeSceneId: "outro", currentFrame: 20, status: "paused" });
    expect(() => service.setCurrentFrame(Number.NaN)).toThrow("invalid player frame");
    expect(() => service.seekToFrame(-1)).toThrow("seek frame");
    expect(() => service.seekToSeconds(Number.NaN)).toThrow("seek time");
    expect(() => service.stepByFrames(0.5)).toThrow("frame delta");
    expect(() => service.attachPlayer(createFakePlayer(-1))).toThrow("invalid player frame");
  });
});

describe("hooks", () => {
  it("memoizes controllers and returns stable external-store snapshots", () => {
    const first = createRuntime().video;
    const second = createRuntime().video;
    const controllerHook = renderHook(({ video }) => useStagecutPlayerController(video), {
      initialProps: { video: first },
    });
    const original = controllerHook.result.current;
    controllerHook.rerender({ video: first });
    expect(controllerHook.result.current).toBe(original);
    controllerHook.rerender({ video: second });
    expect(controllerHook.result.current).not.toBe(original);

    const controller = new StagecutPlayerService(first);
    const stateHook = renderHook(() => useStagecutPlayerState(controller));
    const playbackHook = renderHook(() => useStagecutPlayerPlaybackState(controller));
    const playbackSnapshot = playbackHook.result.current;
    act(() => controller.attachPlayer(createFakePlayer()));
    expect(stateHook.result.current.isReady).toBe(true);
    const readyPlayback = playbackHook.result.current;
    act(() => controller.setCurrentFrame(20));
    expect(stateHook.result.current.currentFrame).toBe(20);
    expect(playbackHook.result.current).toBe(readyPlayback);
    expect(playbackSnapshot).not.toBe(readyPlayback);
  });
});

describe("StagecutComposition", () => {
  it("renders only the two transition scenes, layer context, and stage background", () => {
    const { surfaces, video } = createRuntime();
    remotionState.frame = 20;
    render(<StagecutComposition surfaces={surfaces} video={video} />);
    expect(screen.getByText("Backdrop")).toBeTruthy();
    expect(screen.getByText("intro:Intro:intro-card:30")).toBeTruthy();
    expect(screen.getByText("outro:Outro:outro-card:30")).toBeTruthy();
    expect(screen.getAllByTestId("absolute-fill")[0]?.style.background).toBe("rgb(18, 52, 86)");
  });

  it("renders exit endpoints and fails fast for an unregistered surface", () => {
    const { surfaces, video } = createRuntime();
    remotionState.frame = 29;
    const { container } = render(<StagecutComposition surfaces={surfaces} video={video} />);
    expect(container.querySelector("[style*='opacity: 0']")).toBeTruthy();
    expect(() => render(<StagecutComposition surfaces={{}} video={video} />)).toThrow("unregistered surface");
  });
});

describe("transition styles", () => {
  it.each([
    "none",
    "fade",
    "slideLeft",
    "slideRight",
    "slideUp",
    "slideDown",
    "zoomIn",
    "zoomOut",
    "wipeLeft",
  ] satisfies TransitionName[])("resolves %s enter and exit styles", (kind) => {
    const transition = { durationInFrames: 10, kind };
    const enter = resolveTransitionStyle(transition, { direction: "enter", progress: -1, sceneId: "a" });
    const exit = resolveTransitionStyle(transition, { direction: "exit", progress: 2, sceneId: "a" });
    expect(enter).toBeTypeOf("object");
    expect(exit).toBeTypeOf("object");
  });
});

describe("StagecutPlayer", () => {
  it("renders a stable SSR placeholder", () => {
    const { surfaces, video } = createRuntime();
    const html = renderToString(<StagecutPlayer surfaces={surfaces} video={video} />);
    expect(html).toContain('data-stagecut-placeholder="true"');
    expect(html).toContain("1280 / 720");
    expect(html).toContain("width:100%");
  });

  it("attaches the internal adapter, forwards events, and cleans up", () => {
    const { surfaces, video } = createRuntime();
    const controller = new StagecutPlayerService(video);
    const onError = vi.fn();
    const { unmount } = render(
      <StrictMode>
        <StagecutPlayer
          acknowledgeRemotionLicense
          ariaLabel="Demo animation"
          className="demo"
          controller={controller}
          controls
          interactive
          onError={onError}
          style={{ width: 640 }}
          surfaces={surfaces}
          video={video}
        />
      </StrictMode>,
    );
    expect(screen.getByTestId("mock-remotion-player").classList.contains("demo")).toBe(true);
    expect(controller.getState().isReady).toBe(true);
    expect(playerState.props).toMatchObject({
      acknowledgeRemotionLicense: true,
      controls: true,
      inputProps: { interactive: true },
    });
    act(() => emit("play"));
    expect(controller.getState().status).toBe("playing");
    act(() => emit("waiting"));
    expect(controller.getState().status).toBe("buffering");
    playerState.playing = true;
    act(() => emit("resume"));
    expect(controller.getState().status).toBe("playing");
    act(() => emit("frameupdate", { detail: { frame: 20 } }));
    expect(controller.getState().currentFrame).toBe(20);
    act(() => emit("timeupdate", { detail: { frame: 21 } }));
    act(() => emit("seeked", { detail: { frame: 22 } }));
    act(() => emit("pause"));
    expect(controller.getState()).toMatchObject({ currentFrame: 22, status: "paused" });
    const error = new Error("player failed");
    act(() => emit("error", { detail: { error } }));
    expect(onError).toHaveBeenCalledWith(error);
    act(() => emit("ended"));
    expect(controller.getState().status).toBe("ended");
    unmount();
    expect(controller.getState().isReady).toBe(false);
  });

  it("rejects a controller compiled for a different video", () => {
    const first = createRuntime();
    const second = createRuntime();
    expect(() =>
      render(
        <StagecutPlayer
          controller={new StagecutPlayerService(second.video)}
          surfaces={first.surfaces}
          video={first.video}
        />,
      ),
    ).toThrow("does not match");
  });
});
