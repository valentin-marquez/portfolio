import { describe, expect, it } from "vitest";
import { sonidoDelViento } from "./ambiente";

describe("sonidoDelViento", () => {
  it("una ráfaga completa sigue siendo suave, y en calma queda un colchón apenas audible", () => {
    expect(sonidoDelViento(1, 0.5).ganancia).toBeLessThanOrEqual(0.11);
    expect(sonidoDelViento(0, 0.5).ganancia).toBeGreaterThan(0.01);
    expect(sonidoDelViento(0, 0.5).ganancia).toBeLessThan(0.02);
  });

  it("el paneo sigue a la ola: entra por la izquierda y sale por la derecha", () => {
    expect(sonidoDelViento(1, 0.1).paneo).toBeLessThan(0);
    expect(sonidoDelViento(1, 0.9).paneo).toBeGreaterThan(0);
    for (const f of [-0.3, 0, 0.5, 1, 1.3])
      expect(Math.abs(sonidoDelViento(1, f).paneo)).toBeLessThanOrEqual(0.6);
  });

  it("en calma el viento queda al centro", () => {
    expect(sonidoDelViento(0, 0.1).paneo).toBe(0);
  });

  it("más viento abre un poco el filtro, pero el sonido sigue oscuro", () => {
    expect(sonidoDelViento(1, 0.5).frecuencia).toBeGreaterThan(sonidoDelViento(0, 0.5).frecuencia);
    expect(sonidoDelViento(1, 0.5).frecuencia).toBeLessThanOrEqual(600);
  });
});
