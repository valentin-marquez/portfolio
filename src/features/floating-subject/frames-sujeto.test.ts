import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { encuadres } from "@/features/camera-cuts/encuadres";
import { framesPorAncla } from "./frames-sujeto";

describe("framesPorAncla", () => {
  test("cada ancla del recorrido tiene su set de frames", () => {
    for (const encuadre of encuadres) {
      expect(framesPorAncla[encuadre.nombre]).toBeDefined();
    }
  });

  test("cada set trae al menos dos frames, para poder mezclar", () => {
    for (const frames of Object.values(framesPorAncla)) {
      expect(frames.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("cada frame referenciado existe en public/", () => {
    for (const frames of Object.values(framesPorAncla)) {
      for (const ruta of frames) {
        const archivo = join(process.cwd(), "public", ruta.replace(/^\//, ""));
        expect(existsSync(archivo)).toBe(true);
      }
    }
  });
});
