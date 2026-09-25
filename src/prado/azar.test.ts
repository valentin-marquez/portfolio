import { describe, expect, it } from "vitest";
import { crearAzar } from "./azar";

describe("crearAzar", () => {
  it("es determinista con la misma semilla", () => {
    const a = crearAzar(42);
    const b = crearAzar(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("cambia con otra semilla", () => {
    const a = crearAzar(1);
    const b = crearAzar(2);
    const iguales = Array.from({ length: 20 }, () => a() === b()).filter(Boolean).length;
    expect(iguales).toBeLessThan(2);
  });

  it("devuelve valores en [0, 1)", () => {
    const a = crearAzar(7);
    for (let i = 0; i < 10000; i++) {
      const v = a();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
