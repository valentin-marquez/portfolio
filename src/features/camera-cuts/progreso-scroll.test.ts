import { describe, expect, test } from "vitest";
import { indiceDesdeProgreso, progresoDesdeScroll } from "./progreso-scroll";

describe("progresoDesdeScroll", () => {
  test("el principio del recorrido es 0 y el final es 1", () => {
    expect(progresoDesdeScroll(0, 2000)).toBe(0);
    expect(progresoDesdeScroll(2000, 2000)).toBe(1);
  });

  test("la mitad del recorrido es la mitad del progreso", () => {
    expect(progresoDesdeScroll(1000, 2000)).toBeCloseTo(0.5, 6);
  });

  test("recorta por los dos extremos", () => {
    // el rebote elástico de macOS y de móvil devuelve valores fuera de rango
    expect(progresoDesdeScroll(-300, 2000)).toBe(0);
    expect(progresoDesdeScroll(5000, 2000)).toBe(1);
  });

  test("sin recorrido devuelve 0 en vez de NaN", () => {
    // pasa de verdad: en el primer fotograma la página aún no tiene altura
    expect(progresoDesdeScroll(0, 0)).toBe(0);
    expect(progresoDesdeScroll(120, 0)).toBe(0);
  });
});

describe("indiceDesdeProgreso", () => {
  test("cada parada ocupa una franja igual del recorrido", () => {
    expect(indiceDesdeProgreso(0, 4)).toBe(0);
    expect(indiceDesdeProgreso(0.24, 4)).toBe(0);
    expect(indiceDesdeProgreso(0.26, 4)).toBe(1);
    expect(indiceDesdeProgreso(0.51, 4)).toBe(2);
    expect(indiceDesdeProgreso(0.76, 4)).toBe(3);
  });

  test("el final del recorrido es la última parada, no una de más", () => {
    expect(indiceDesdeProgreso(1, 4)).toBe(3);
  });

  test("recorta si llega progreso fuera de rango", () => {
    expect(indiceDesdeProgreso(-0.4, 4)).toBe(0);
    expect(indiceDesdeProgreso(1.8, 4)).toBe(3);
  });

  test("con una sola parada siempre devuelve 0", () => {
    expect(indiceDesdeProgreso(0.7, 1)).toBe(0);
  });
});
