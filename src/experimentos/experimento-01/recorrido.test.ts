import { describe, expect, it } from "vitest";
import { recorrido } from "./recorrido";
import { velocidad } from "./resortes";

describe("recorrido", () => {
  const f = recorrido([
    [0, 0],
    [1, 10],
    [2, 30],
    [3, 40],
  ]);

  it("pasa por los puntos y se queda quieto fuera de ellos", () => {
    expect(f(0)).toBe(0);
    expect(f(1)).toBeCloseTo(10, 12);
    expect(f(2)).toBeCloseTo(30, 12);
    expect(f(3)).toBe(40);
    expect(f(-5)).toBe(0);
    expect(f(9)).toBe(40);
  });

  it("parte y termina con velocidad cero, como una mano que agarra y suelta", () => {
    expect(Math.abs(velocidad(f, 1e-4, 5e-5))).toBeLessThan(0.1);
    expect(Math.abs(velocidad(f, 3 - 1e-4, 5e-5))).toBeLessThan(0.1);
  });

  it("es suave en los puntos intermedios", () => {
    const izq = velocidad(f, 1 - 1e-4, 5e-5);
    const der = velocidad(f, 1 + 1e-4, 5e-5);
    expect(Math.abs(izq - der)).toBeLessThan(0.05);
  });

  it("exige tiempos crecientes", () => {
    expect(() => recorrido([[1, 0]])).toThrow();
    expect(() =>
      recorrido([
        [1, 0],
        [1, 2],
      ]),
    ).toThrow(/crecer/);
  });
});
