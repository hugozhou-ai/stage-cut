import "@fontsource-variable/lexend";
import { StagecutComposition } from "@stage-cut/react-player";
import { Composition, registerRoot } from "remotion";
import "../gallery/src/styles.css";
import { promoSurfaces, promoVideo } from "./src/promoProject";

function PromoComposition() {
  return <StagecutComposition surfaces={promoSurfaces} video={promoVideo} />;
}

function PromoRenderRoot() {
  return (
    <Composition
      component={PromoComposition}
      durationInFrames={promoVideo.timeline.durationInFrames}
      fps={promoVideo.fps}
      height={promoVideo.stage.height}
      id="bead-grid-promo"
      width={promoVideo.stage.width}
    />
  );
}

registerRoot(PromoRenderRoot);
