import "@fontsource-variable/lexend";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { galleryProject, gallerySurfaces } from "./galleryProject";
import { App } from "./main";

const StagecutDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import("@stage-cut/devtools");
      return { default: module.StagecutDevtools };
    })
  : null;

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
    {StagecutDevtools ? (
      <Suspense fallback={null}>
        <StagecutDevtools acknowledgeRemotionLicense enabled project={galleryProject} surfaces={gallerySurfaces} />
      </Suspense>
    ) : null}
  </StrictMode>,
);
