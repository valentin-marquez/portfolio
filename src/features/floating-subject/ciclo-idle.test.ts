import { describe, expect, test } from "vitest";
import { cuadroIdle, type RitmoIdle } from "./ciclo-idle";

const ritmo: RitmoIdle = { retencion: 3, gesto: 0.1 };

describe("cuadroIdle", () => {
  test("la pose asentada ocupa casi todo el ciclo", () => {
    expect(cuadroIdle(0, 3, ritmo)).toBe(0);
    expect(cuadroIdle(2.99, 3, ritmo)).toBe(0);
  });

  test("los gestos pasan en un parpadeo", () => {
    expect(cuadroIdle(3.05, 3, ritmo)).toBe(1);
    expect(cuadroIdle(3.15, 3, ritmo)).toBe(2);
  });

  test("al acabar el ciclo vuelve a la pose asentada", () => {
    // ciclo = 3 + 0.1 + 0.1 = 3.2
    expect(cuadroIdle(3.25, 3, ritmo)).toBe(0);
    expect(cuadroIdle(3.2 * 5 + 1, 3, ritmo)).toBe(0);
  });

  test("el ciclo se repite indefinidamente", () => {
    expect(cuadroIdle(3.2 * 40 + 3.05, 3, ritmo)).toBe(1);
  });

  test("con un solo frame no hay ciclo", () => {
    expect(cuadroIdle(9.5, 1, ritmo)).toBe(0);
  });

  test("sin frames no revienta", () => {
    expect(cuadroIdle(9.5, 0, ritmo)).toBe(0);
  });

  test("un tiempo negativo no rompe el ciclo", () => {
    const i = cuadroIdle(-1, 3, ritmo);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(3);
  });

  test("con los tiempos a cero se queda en el primer frame", () => {
    expect(cuadroIdle(7, 3, { retencion: 0, gesto: 0 })).toBe(0);
  });
});
