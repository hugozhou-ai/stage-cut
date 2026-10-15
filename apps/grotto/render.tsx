import { StagecutRenderRoot, StagecutResource } from "@stage-cut/react-player";
import type { ReactNode } from "react";
import { registerRoot, staticFile } from "remotion";
import { project, surfaces } from "./src/project";

function Fonts({ children }: { children: ReactNode }) {
  return (
    <StagecutResource
      id="grotto-serif"
      load={async () => {
        const font = new FontFace("Grotto Serif", `url(${staticFile("serif.woff2")})`);
        await font.load();
        document.fonts.add(font);
        return font;
      }}
      dispose={(font) => {
        document.fonts.delete(font);
      }}
    >
      {() => children}
    </StagecutResource>
  );
}
registerRoot(() => <StagecutRenderRoot project={project} surfaces={surfaces} wrapper={Fonts} />);
