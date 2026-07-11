import "@fontsource-variable/lexend";
import { StagecutComposition } from "@stage-cut/react-player";
import { Composition, registerRoot } from "remotion";
import { type GalleryPageId, gallerySurfaces, galleryVideos } from "./src/galleryProject";
import "./src/styles.css";

const videoIds = ["application-dialog"] as const satisfies readonly GalleryPageId[];

function GalleryComposition({ videoId }: { videoId: GalleryPageId }) {
  return <StagecutComposition surfaces={gallerySurfaces} video={galleryVideos[videoId]} />;
}

function GalleryRenderRoot() {
  return (
    <>
      {videoIds.map((videoId) => {
        const video = galleryVideos[videoId];
        return (
          <Composition
            component={GalleryComposition}
            defaultProps={{ videoId }}
            durationInFrames={video.timeline.durationInFrames}
            fps={video.fps}
            height={video.stage.height}
            id={videoId}
            key={videoId}
            width={video.stage.width}
          />
        );
      })}
    </>
  );
}

registerRoot(GalleryRenderRoot);
