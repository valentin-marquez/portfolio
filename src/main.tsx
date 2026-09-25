import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/caveat/500.css";
import "@fontsource/source-code-pro/400.css";
import "./estilos/globales.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("falta el elemento #raiz");
createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
