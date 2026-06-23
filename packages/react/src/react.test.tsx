import { PlayerVideo, VideoFrame } from "@stagecut/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StagecutComposition } from "./StagecutComposition";
import { StagecutPlayer } from "./StagecutPlayer";
import { StagecutPlayerService } from "./StagecutPlayerService";
import type { AttachablePlayer, FrameRenderContext } from "./types";

vi.mock("remotion", () => ({
  AbsoluteFill: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <div data-testid="absolute-fill" style={style}>
      {children}
    </div>
  ),
  Sequence: ({ children }: { children?: React.ReactNode }) => <div data-testid="sequence">{children}</div>,
  useCurrentFrame: () => 0,
}));

vi.mock("@remotion/player", () => ({
  Player: ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <div className={className} data-testid="mock-remotion-player" style={style} />
  ),
}));

function createVideo() {
  return new PlayerVideo({
    fps: 30,
    frames: [
      new VideoFrame({
        durationInFrames: 30,
        id: "intro",
        inputProps: { title: "Intro" },
        surfaceId: "card",
      }).toJSON(),
      new VideoFrame({
        durationInFrames: 30,
        id: "outro",
        inputProps: { title: "Outro" },
        surfaceId: "card",
      }).toJSON(),
    ],
    height: 720,
    id: "demo",
    name: "Demo",
    stageId: "desktop",
    transition: { durationInFrames: 10, kind: "fade" },
    width: 1280,
  });
}

function createFakePlayer(): AttachablePlayer & {
  playMock: ReturnType<typeof vi.fn>;
  seekToMock: ReturnType<typeof vi.fn>;
} {
  let currentFrame = 0;
  let isPlaying = false;
  const playMock = vi.fn(() => {
    isPlaying = true;
  });
  const seekToMock = vi.fn((frame: number) => {
    currentFrame = frame;
  });

  return {
    addEventListener: vi.fn(),
    getCurrentFrame: () => currentFrame,
    isPlaying: () => isPlaying,
    pause: vi.fn(() => {
      isPlaying = false;
    }),
    play: playMock,
    playMock,
    removeEventListener: vi.fn(),
    seekTo: seekToMock,
    seekToMock,
    toggle: vi.fn(() => {
      isPlaying = !isPlaying;
    }),
  };
}

describe("StagecutPlayerService", () => {
  it("syncs player readiness and commands", () => {
    const video = createVideo();
    const service = new StagecutPlayerService(video);
    const player = createFakePlayer();
    const listener = vi.fn();

    service.subscribe(listener);
    service.attachPlayer(player);
    service.play();
    service.seekToFrame(25);
    service.markPlaying();

    expect(player.playMock).toHaveBeenCalledTimes(1);
    expect(player.seekToMock).toHaveBeenCalledWith(25);
    expect(service.getState()).toMatchObject({
      activeFrameId: "outro",
      currentFrame: 25,
      isReady: true,
      status: "playing",
    });
    expect(listener).toHaveBeenCalled();
  });

  it("keeps playback subscribers out of frame-only updates", () => {
    const service = new StagecutPlayerService(createVideo());
    const player = createFakePlayer();
    const frameListener = vi.fn();
    const playbackListener = vi.fn();

    service.subscribe(frameListener);
    service.subscribePlayback(playbackListener);
    service.attachPlayer(player);

    expect(playbackListener).toHaveBeenCalledTimes(1);

    frameListener.mockClear();
    playbackListener.mockClear();
    service.setCurrentFrame(20);

    expect(frameListener).toHaveBeenCalledTimes(1);
    expect(playbackListener).not.toHaveBeenCalled();
  });

  it("replays from the first frame after reaching the end", () => {
    const video = createVideo();
    const service = new StagecutPlayerService(video);
    const player = createFakePlayer();

    service.attachPlayer(player);
    service.seekToFrame(video.durationInFrames - 1);
    service.markEnded();
    player.playMock.mockClear();
    player.seekToMock.mockClear();

    service.play();

    expect(player.seekToMock).toHaveBeenCalledWith(0);
    expect(player.playMock).toHaveBeenCalledTimes(1);
    expect(service.getState()).toMatchObject({ currentFrame: 0 });
  });
});

describe("StagecutComposition", () => {
  it("renders the mapped surface with frame render context", () => {
    const Card = ({ frameId, title }: { title?: string } & FrameRenderContext) => (
      <div>
        {frameId}:{title}
      </div>
    );

    render(<StagecutComposition surfaces={{ card: Card }} video={createVideo()} />);

    expect(screen.getByText("intro:Intro")).toBeTruthy();
  });
});

describe("StagecutPlayer", () => {
  it("renders a placeholder when requested", () => {
    const { container } = render(<StagecutPlayer mountPolicy="placeholder" surfaces={{}} video={createVideo()} />);

    expect(container.querySelector("[data-stagecut-placeholder='true']")).toBeTruthy();
  });
});
