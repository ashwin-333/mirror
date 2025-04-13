import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IphonePro } from "./screens/IphonePro";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <IphonePro />
  </StrictMode>,
);
