import { describe, expect, it } from "vitest";
import { calcularProgreso, destinosAterrizaje, destinosJuntoALaFlor } from "./escena";

describe("calcularProgreso", () => {
  it("va de 0 arriba a 1 abajo", () => {
    expect(calcularProgreso(0, 3000, 900)).toBe(0);
    expect(calcularProgreso(2100, 3000, 900)).toBe(1);
    expect(calcularProgreso(1050, 3000, 900)).toBeCloseTo(0.5);
  });

  it("queda acotado aunque el navegador reporte rebote de scroll (valores negativos o de más)", () => {
    expect(calcularProgreso(-40, 3000, 900)).toBe(0);
    expect(calcularProgreso(2300, 3000, 900)).toBe(1);
  });

  it("si la página no tiene scroll, el progreso es 0", () => {
    expect(calcularProgreso(0, 800, 900)).toBe(0);
  });
});

describe("destinosAterrizaje", () => {
  it("reparte puntos dentro del prado del cierre, en su parte baja", () => {
    const rect = { left: 220, top: 400, width: 1000, height: 400 };
    const d = destinosAterrizaje(rect, 8);
    expect(d).toHaveLength(8);
    for (const p of d) {
      expect(p.x).toBeGreaterThan(rect.left);
      expect(p.x).toBeLessThan(rect.left + rect.width);
      expect(p.y).toBeGreaterThan(rect.top + rect.height * 0.5);
      expect(p.y).toBeLessThan(rect.top + rect.height);
    }
  });
});

describe("destinosJuntoALaFlor", () => {
  it("las semillas vuelven a la flor: aterrizan cerca, en el pasto bajo su cabeza, a ambos lados", () => {
    const cabeza = { x: 900, y: 300 };
    const d = destinosJuntoALaFlor(cabeza, 6);
    expect(d).toHaveLength(6);
    for (const p of d) {
      expect(Math.hypot(p.x - cabeza.x, p.y - cabeza.y)).toBeLessThan(200);
      expect(p.y).toBeGreaterThan(cabeza.y + 20);
    }
    expect(d.some((p) => p.x < cabeza.x)).toBe(true);
    expect(d.some((p) => p.x > cabeza.x)).toBe(true);
  });
});
