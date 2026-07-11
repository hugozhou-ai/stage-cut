import type { StagecutProjectDefinition } from "@stagecut/core";
import type { SurfaceComponentMap } from "@stagecut/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Studio } from "./Studio";
import { devtoolsStyles } from "./styles";

export interface StagecutDevtoolsProps {
  acknowledgeRemotionLicense?: boolean;
  enabled: boolean;
  project: StagecutProjectDefinition;
  queryParam?: string;
  surfaces: SurfaceComponentMap;
}

type DevtoolsMode = "hidden" | "launcher" | "studio";

function modeFromLocation(queryParam: string): DevtoolsMode {
  if (typeof window === "undefined") return "hidden";
  const search = new URLSearchParams(window.location.search);
  if (!search.has(queryParam)) return "hidden";
  return search.get(queryParam) === "studio" ? "studio" : "launcher";
}

export function StagecutDevtools({
  acknowledgeRemotionLicense = false,
  enabled,
  project,
  queryParam = "stagecut",
  surfaces,
}: StagecutDevtoolsProps) {
  const [mode, setMode] = useState<DevtoolsMode>("hidden");
  const [openError, setOpenError] = useState<string>();

  useEffect(() => {
    setMode(enabled ? modeFromLocation(queryParam) : "hidden");
  }, [enabled, queryParam]);

  if (!enabled || mode === "hidden" || typeof document === "undefined") return null;

  const content = (
    <div className="stagecut-devtools-root" data-stagecut-devtools={mode}>
      <style>{devtoolsStyles}</style>
      {mode === "studio" ? (
        <Studio acknowledgeRemotionLicense={acknowledgeRemotionLicense} project={project} surfaces={surfaces} />
      ) : (
        <div className="stagecut-devtools-launcher">
          {openError ? <span role="alert">{openError}</span> : null}
          <button
            aria-label="Open Stagecut Devtools"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set(queryParam, "studio");
              const opened = window.open(url.toString(), "_blank");
              if (!opened) {
                setOpenError("The Studio tab was blocked by the browser.");
                return;
              }
              opened.opener = null;
              setOpenError(undefined);
            }}
            title="Open Stagecut Devtools"
            type="button"
          >
            S
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
