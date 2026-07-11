import "@fontsource-variable/lexend";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./main";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
