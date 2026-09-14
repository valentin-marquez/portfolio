import { describe, expect, test } from "vitest";
import { cuadroIdle, type RitmoIdle } from "./ciclo-idle";

const ritmo: RitmoIdle = { retencion: 3, gesto: 0.3, transicion: 0.2 };

describe("cuadroIdle", () => {
  test("la pose asentada se mantiene quieta casi todo el ciclo", () => {
    expect(cuadroIdle(0, 3, ritmo)).toEqual({ indiceActual: 0, indiceSiguiente: 1, transicion: 0 });
    expect(cuadroIdle(2.9, 3, ritmo)).toEqual({
      indiceActual: 0,
      indiceSiguiente: 1,
      transicion: 0,
    });
  });

  test("al agotarse la retención empieza el paso al frame siguiente", () => {
    const c = cuadroIdle(3.1, 3, ritmo);
    expect(c.indiceActual).toBe(0);
    expect(c.indiceSiguiente).toBe(1);
    expect(c.transicion).toBeCloseTo(0.5, 6);
  });

  test("los frames de gesto pasan rápido", () => {
    expect(cuadroIdle(3.3, 3, ritmo)).toEqual({
      indiceActual: 1,
      indiceSiguiente: 2,
      transicion: 0,
    });
    const c = cuadroIdle(3.6, 3, ritmo);
    expect(c.indiceActual).toBe(1);
    expect(c.indiceSiguiente).toBe(2);
    expect(c.transicion).toBeCloseTo(0.5, 6);
  });

  test("el último frame vuelve al primero", () => {
    // ciclo = (3+0.2) + (0.3+0.2) + (0.3+0.2) = 4.2
    expect(cuadroIdle(3.9, 3, ritmo).indiceSiguiente).toBe(0);
    expect(cuadroIdle(4.2, 3, ritmo)).toEqual({
      indiceActual: 0,
      indiceSiguiente: 1,
      transicion: 0,
    });
  });

  test("el ciclo se repite indefinidamente", () => {
    expect(cuadroIdle(4.2 * 7, 3, ritmo)).toEqual(cuadroIdle(0, 3, ritmo));
  });

  test("sin transición el cambio es un corte seco", () => {
    const seco: RitmoIdle = { retencion: 3, gesto: 0.3, transicion: 0 };
    expect(cuadroIdle(2.99, 3, seco).indiceActual).toBe(0);
    expect(cuadroIdle(3.01, 3, seco)).toEqual({
      indiceActual: 1,
      indiceSiguiente: 2,
      transicion: 0,
    });
  });

  test("con un solo frame no hay ciclo", () => {
    expect(cuadroIdle(9.5, 1, ritmo)).toEqual({
      indiceActual: 0,
      indiceSiguiente: 0,
      transicion: 0,
    });
  });

  test("un tiempo negativo no rompe el ciclo", () => {
    // el resto de un módulo con negativos es negativo en JS: hay que corregirlo
    const c = cuadroIdle(-1, 3, ritmo);
    expect(c.indiceActual).toBeGreaterThanOrEqual(0);
    expect(c.indiceActual).toBeLessThan(3);
    expect(c.transicion).toBeGreaterThanOrEqual(0);
    expect(c.transicion).toBeLessThanOrEqual(1);
  });
});
