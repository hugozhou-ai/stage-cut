import { StagecutProject, VideoFrame } from "@stagecut/core";

export const exampleProject = new StagecutProject({
  description: "A compact Stagecut demo project for composing DOM surfaces into a playable video.",
  id: "stagecut-demo",
  name: "Stagecut Demo",
  stages: [
    {
      background: "linear-gradient(135deg, #141824 0%, #272b3a 48%, #111827 100%)",
      height: 720,
      id: "desktop-stage",
      name: "Desktop Stage",
      width: 1280,
    },
  ],
  surfaces: [
    {
      description: "Desktop-like shell with status chrome and background workspace.",
      id: "workspace-shell",
      name: "Workspace Shell",
    },
    {
      description: "Agent prompt and response dialog for presenting a task handoff.",
      id: "agent-dialog",
      name: "Agent Dialog",
    },
    {
      description: "Review surface showing generated files and acceptance status.",
      id: "file-review",
      name: "File Review",
    },
  ],
  videos: [
    {
      description: "A three-frame DOM player-video assembled from generic surfaces.",
      fps: 30,
      frames: [
        new VideoFrame({
          durationInFrames: 45,
          id: "workspace-intro",
          inputProps: {
            caption: "Open workspace",
            status: "Ready for a new player-video",
          },
          metadata: {
            stageAccent: "workspace",
            surfaceRole: "environment",
          },
          surfaceId: "workspace-shell",
          transition: { durationInFrames: 12, kind: "fade" },
        }).toJSON(),
        new VideoFrame({
          durationInFrames: 72,
          id: "agent-handoff",
          inputProps: {
            prompt: "Create a launch animation from these surfaces.",
            response: "I will compose the shell, dialog, and review states into a playable timeline.",
          },
          metadata: {
            stageAccent: "agent",
            surfaceRole: "conversation",
          },
          surfaceId: "agent-dialog",
          transition: {
            in: { durationInFrames: 12, kind: "slideUp" },
            out: { durationInFrames: 10, kind: "fade" },
          },
        }).toJSON(),
        new VideoFrame({
          durationInFrames: 60,
          id: "review-output",
          inputProps: {
            files: "3 surfaces, 1 video, 1 prompt export",
            verdict: "Ready to implement in target repo",
          },
          metadata: {
            stageAccent: "review",
            surfaceRole: "handoff",
          },
          surfaceId: "file-review",
          transition: { durationInFrames: 12, kind: "zoomIn" },
        }).toJSON(),
      ],
      height: 720,
      id: "studio-demo-video",
      name: "Studio Demo Video",
      playback: {
        controls: false,
        defaultStatus: "paused",
        loop: true,
      },
      stageId: "desktop-stage",
      transition: { durationInFrames: 10, kind: "fade" },
      width: 1280,
    },
  ],
});
