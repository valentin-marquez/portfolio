import { describe, expect, it } from "vitest";
import { GIRO_MAX, pasoPendulo } from "./pendulo";

describe("péndulo de un pase", () => {
  it("se asienta en el ángulo que le pide el viento", () => {
    const p = { angulo: 0, velocidad: 0 };
    for (let i = 0; i < 600; i++) pasoPendulo(p, 2, 1 / 60);
    expect(p.angulo).toBeCloseTo(2, 2);
  });

  it("un empujón fuerte o un salto de tiempo no lo sacan de su tope", () => {
    const p = { angulo: 0, velocidad: 5000 };
    for (let i = 0; i < 10; i++) pasoPendulo(p, 0, 3);
    expect(Math.abs(p.angulo)).toBeLessThanOrEqual(GIRO_MAX);
    expect(Number.isFinite(p.velocidad)).toBe(true);
  });
});
