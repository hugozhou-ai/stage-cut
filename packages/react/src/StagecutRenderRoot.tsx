import { compileStagecutVideo, type StagecutProjectDefinition } from "@stage-cut/core";
import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";
import { Composition } from "remotion";
import { StagecutComposition } from "./StagecutComposition";
import type { SurfaceComponentMap } from "./types";

export interface StagecutRenderRootProps {
  project: StagecutProjectDefinition;
  surfaces: SurfaceComponentMap;
  /** Shared preparation or providers; use the same wrapper in browser preview. */
  wrapper?: ComponentType<{ children: ReactNode }>;
}

/** Registers all project videos with dimensions and duration from the compiler. */
export function StagecutRenderRoot({ project, surfaces, wrapper: Wrapper }: StagecutRenderRootProps) {
  const entries = useMemo(
    () =>
      project.videos.map(({ id }) => {
        const video = compileStagecutVideo(project, id);
        const component = () => {
          const content = <StagecutComposition surfaces={surfaces} video={video} />;
          return Wrapper ? <Wrapper>{content}</Wrapper> : content;
        };
        return { video, component };
      }),
    [project, surfaces, Wrapper],
  );
  return (
    <>
      {entries.map(({ video, component }) => (
        <Composition
          key={video.id}
          id={video.id}
          component={component}
          fps={video.fps}
          width={video.stage.width}
          height={video.stage.height}
          durationInFrames={video.timeline.durationInFrames}
        />
      ))}
    </>
  );
}
