/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // pre-empaquetadas desde el arranque: si Vite las descubre a mitad de sesión recarga con dos
  // copias de React y aparece "Invalid hook call" hasta refrescar
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "motion/react", "tweakpane"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
