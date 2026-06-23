import type { StagecutProject } from "./StagecutProject";
import type { StagecutProjectJson } from "./types";

export function exportProjectJson(project: StagecutProject): StagecutProjectJson {
  return project.toJSON();
}

export function exportProjectJsonString(project: StagecutProject): string {
  return JSON.stringify(exportProjectJson(project), null, 2);
}

export function exportAgentPrompt(project: StagecutProject): string {
  const json = project.toJSON();
  const videoSummaries = project.videos
    .map((video) => {
      const frames = video.frames
        .map((frame) => `- ${frame.id}: surface "${frame.surfaceId}", ${frame.durationInFrames} frames`)
        .join("\n");

      return `Video "${video.id}" (${video.width}x${video.height}, ${video.fps}fps):\n${frames}`;
    })
    .join("\n\n");
  const surfaces = project.surfaces
    .map((surface) => `- ${surface.id}: ${surface.description ?? surface.name}`)
    .join("\n");

  return [
    `You are implementing a Stagecut player-video project named "${project.name}".`,
    "",
    "Goal:",
    "Create DOM surface components, compose them into the listed video frames, and mount the resulting player in the target React app.",
    "",
    "Surfaces to implement:",
    surfaces,
    "",
    "Videos and frames:",
    videoSummaries,
    "",
    "Implementation rules:",
    "- Keep business/domain state outside surface components; surfaces only render their input props.",
    "- Use the Stagecut runtime player for preview/playback; do not hand-roll frame timing.",
    "- Preserve frame ids, surface ids, durations, transition config, and metadata exactly.",
    "- Store the project definition near the video entrypoint so future agents can update the timeline structurally.",
    "",
    "Project JSON:",
    "```json",
    JSON.stringify(json, null, 2),
    "```",
  ].join("\n");
}
