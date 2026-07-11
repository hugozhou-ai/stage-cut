import { compileStagecutVideo, defineStagecutProject } from "@stagecut/core";
import { defineSurfaceRegistry } from "@stagecut/react-player";
import { ApplicationDialogSurface } from "./cases/applicationDialog";
import { MessageClusterSurface } from "./cases/messageCluster";
import { TaskFlowSurface } from "./cases/taskFlow";

const layer = (surfaceId: string, phase: string, inputProps: Record<string, string | number> = {}) => ({
  id: `${phase}-surface`,
  inputProps: { phase, ...inputProps },
  surfaceId,
});

export const galleryProject = defineStagecutProject({
  description:
    "Complex production-style cases reconstructed from the Tutti Remotion preview with Stagecut's public API.",
  id: "stagecut-production-gallery",
  name: "Stagecut Production Gallery",
  schemaVersion: 1,
  stages: [
    {
      background: "#070910",
      height: 900,
      id: "desktop-stage",
      name: "Desktop 1440 × 900",
      width: 1440,
    },
  ],
  surfaces: [
    { description: "Animated cross-functional project routing graph.", id: "task-flow", name: "Task Flow" },
    {
      description: "Scattered activity cards reorganized into contextual groups.",
      id: "message-cluster",
      name: "Message Cluster",
    },
    {
      description: "Application creation dialog, reference palette, and generated result.",
      id: "application-dialog",
      name: "Application Dialog",
    },
  ],
  videos: [
    {
      description: "A project brief branches into four workstreams and brings the team into alignment.",
      fps: 30,
      id: "task-flow",
      name: "Cross-functional Task Flow",
      playback: { autoPlay: false, defaultStatus: "paused", loop: true },
      scenes: [
        { durationInFrames: 42, id: "prompt-typing", layers: [layer("task-flow", "typing")], name: "Type the task" },
        {
          durationInFrames: 30,
          id: "branches-reveal",
          layers: [layer("task-flow", "branches")],
          name: "Reveal workstreams",
        },
        ...Array.from({ length: 4 }, (_, index) => ({
          durationInFrames: 28,
          id: `dispatch-${index + 1}`,
          layers: [layer("task-flow", `dispatch-${index + 1}`, { activeAgent: index, phase: "dispatch" })],
          name: `Share brief ${index + 1}`,
        })),
        ...Array.from({ length: 4 }, (_, index) => ({
          durationInFrames: 22,
          id: `workstream-${index + 1}`,
          layers: [
            layer("task-flow", `agent-${index + 1}`, { activeAgent: 4, phase: "agents", visibleAgents: index + 1 }),
          ],
          name: `Workstream ${index + 1} joins`,
        })),
        {
          durationInFrames: 68,
          id: "team-messages",
          layers: [layer("task-flow", "messages", { activeAgent: 4, visibleAgents: 4 })],
          name: "Team synchronized",
        },
      ],
      stageId: "desktop-stage",
    },
    {
      description: "Six project updates scatter into view, align, collapse into contextual groups, and expose actions.",
      fps: 30,
      id: "message-cluster",
      name: "Project Activity Cluster",
      playback: { autoPlay: false, defaultStatus: "paused", loop: true },
      scenes: [
        {
          durationInFrames: 48,
          id: "cards-scatter",
          layers: [layer("message-cluster", "scatter")],
          name: "Incoming signals",
        },
        {
          durationInFrames: 54,
          id: "cards-align",
          layers: [layer("message-cluster", "align")],
          name: "Normalize cards",
        },
        {
          durationInFrames: 64,
          id: "cards-group",
          layers: [layer("message-cluster", "group")],
          name: "Group by project",
        },
        {
          durationInFrames: 54,
          id: "actions-menu",
          layers: [layer("message-cluster", "menu")],
          name: "Reveal actions",
        },
      ],
      stageId: "desktop-stage",
    },
    {
      description:
        "A desktop creation brief opens its reference palette, selects Visual Canvas, and materializes a visual.",
      fps: 30,
      id: "application-dialog",
      name: "Application Creation Dialog",
      playback: { autoPlay: false, defaultStatus: "paused", loop: true },
      scenes: [
        {
          durationInFrames: 34,
          id: "dialog-enter",
          layers: [layer("application-dialog", "enter")],
          name: "Open dialog",
        },
        {
          durationInFrames: 48,
          id: "prompt-mention",
          layers: [layer("application-dialog", "mention")],
          name: "Write prompt",
        },
        {
          durationInFrames: 70,
          id: "reference-palette",
          layers: [layer("application-dialog", "palette")],
          name: "Browse references",
        },
        {
          durationInFrames: 36,
          id: "select-visual-canvas",
          layers: [layer("application-dialog", "select")],
          name: "Select Visual Canvas",
        },
        {
          durationInFrames: 72,
          id: "creation-result",
          layers: [layer("application-dialog", "complete")],
          name: "Generate visual",
        },
      ],
      stageId: "desktop-stage",
    },
  ],
});

export const gallerySurfaces = defineSurfaceRegistry(galleryProject, {
  "application-dialog": ApplicationDialogSurface,
  "message-cluster": MessageClusterSurface,
  "task-flow": TaskFlowSurface,
});

export const galleryVideos = {
  "application-dialog": compileStagecutVideo(galleryProject, "application-dialog"),
  "message-cluster": compileStagecutVideo(galleryProject, "message-cluster"),
  "task-flow": compileStagecutVideo(galleryProject, "task-flow"),
} as const;

export type GalleryPageId = keyof typeof galleryVideos;
