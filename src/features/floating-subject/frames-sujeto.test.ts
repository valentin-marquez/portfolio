import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { encuadres } from "@/features/camera-cuts/encuadres";
import { flujosPorAncla, framesPorAncla } from "./frames-sujeto";

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

describe("flujosPorAncla", () => {
  test("cada mapa referenciado existe en public/", () => {
    for (const flujos of Object.values(flujosPorAncla)) {
      for (const ruta of flujos) {
        const archivo = join(process.cwd(), "public", ruta.replace(/^\//, ""));
        expect(existsSync(archivo)).toBe(true);
      }
    }
  });

  test("hay un mapa por paso del bucle del ancla", () => {
    // el mapa i lleva del frame i al i+1, así que hacen falta tantos como frames
    for (const [ancla, flujos] of Object.entries(flujosPorAncla)) {
      expect(flujos.length).toBe(framesPorAncla[ancla]?.length);
    }
  });
});
