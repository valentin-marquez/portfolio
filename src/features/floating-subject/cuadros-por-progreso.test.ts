import { describe, expect, test } from "vitest";
import { cuadrosPorProgreso } from "./cuadros-por-progreso";

describe("cuadrosPorProgreso", () => {
  test("en progreso 0 se ve el primer frame puro", () => {
    expect(cuadrosPorProgreso(0, 3)).toEqual({ indiceActual: 0, indiceSiguiente: 1, mezcla: 0 });
  });

  test("en progreso 1 se ve el último frame puro", () => {
    expect(cuadrosPorProgreso(1, 3)).toEqual({ indiceActual: 1, indiceSiguiente: 2, mezcla: 1 });
  });

  test("reparte el progreso entre todos los frames por igual", () => {
    // con 3 frames el tramo se parte en dos mitades: 0-0.5 y 0.5-1
    expect(cuadrosPorProgreso(0.25, 3)).toEqual({
      indiceActual: 0,
      indiceSiguiente: 1,
      mezcla: 0.5,
    });
    expect(cuadrosPorProgreso(0.75, 3)).toEqual({
      indiceActual: 1,
      indiceSiguiente: 2,
      mezcla: 0.5,
    });
  });

  test("recorta si el progreso local llega fuera de [0, 1]", () => {
    expect(cuadrosPorProgreso(-0.4, 3).indiceActual).toBe(0);
    expect(cuadrosPorProgreso(1.8, 3)).toEqual({
      indiceActual: 1,
      indiceSiguiente: 2,
      mezcla: 1,
    });
  });

  test("con un solo frame no hay nada que mezclar", () => {
    expect(cuadrosPorProgreso(0.5, 1)).toEqual({ indiceActual: 0, indiceSiguiente: 0, mezcla: 0 });
  });

  test("sin frames tampoco revienta", () => {
    expect(cuadrosPorProgreso(0.5, 0)).toEqual({ indiceActual: 0, indiceSiguiente: 0, mezcla: 0 });
  });
});
