/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/** páginas que viven en la raíz sin extensión: /experimento-01 sirve experimento-01.html */
const PAGINAS = ["experimento-01"];

/** en desarrollo y en preview, igual que en producción: /experimento-01 (sin .html ni barra final) */
function rutasLimpias(): Plugin {
  const reescribir = (req: { url?: string }) => {
    const [ruta = "", consulta] = (req.url ?? "").split("?");
    if (PAGINAS.includes(ruta.slice(1))) req.url = `${ruta}.html${consulta ? `?${consulta}` : ""}`;
  };
  return {
    name: "rutas-limpias",
    configureServer(servidor) {
      servidor.middlewares.use((req, _res, next) => {
        reescribir(req);
        next();
      });
    },
    configurePreviewServer(servidor) {
      servidor.middlewares.use((req, _res, next) => {
        reescribir(req);
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rutasLimpias()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      input: {
        principal: fileURLToPath(new URL("./index.html", import.meta.url)),
        ...Object.fromEntries(
          PAGINAS.map((p) => [p, fileURLToPath(new URL(`./${p}.html`, import.meta.url))]),
        ),
      },
      output: {
        // lo que comparten la portada y las páginas va en su propio archivo: si queda dentro del
        // archivo de la portada, cada página ejecutaría también el arranque de la portada
        advancedChunks: {
          groups: [{ name: "compartido", test: /src\/(audio|prado)\/|node_modules\/(motion|motion-dom|motion-utils|framer-motion)\// }],
        },
      },
    },
  },
  // pre-empaquetadas desde el arranque: si Vite las descubre a mitad de sesión recarga con dos
  // copias de React y aparece "Invalid hook call" hasta refrescar
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "motion", "motion/react", "tweakpane"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
