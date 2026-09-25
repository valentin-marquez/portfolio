import { describe, expect, it } from "vitest";
import { cabezaTocada, estadoCabeza } from "./cabezas";

describe("estadoCabeza (0 llena, 1 pelada)", () => {
  it("una cabeza que nadie sopló está llena", () => {
    expect(estadoCabeza(null)).toBe(0);
  });

  it("al soplarla se deshace en menos de un segundo", () => {
    expect(estadoCabeza(0)).toBe(0);
    const aMedias = estadoCabeza(0.3);
    expect(aMedias).toBeGreaterThan(0);
    expect(aMedias).toBeLessThan(1);
    expect(estadoCabeza(0.8)).toBe(1);
  });

  it("queda pelada un buen rato y después vuelve a llenarse despacio, sin saltos", () => {
    expect(estadoCabeza(10)).toBe(1);
    let anterior = 1;
    for (let t = 20; t <= 40; t += 0.25) {
      const e = estadoCabeza(t);
      expect(e).toBeLessThanOrEqual(anterior);
      expect(anterior - e).toBeLessThan(0.05);
      anterior = e;
    }
    expect(estadoCabeza(40)).toBe(0);
  });
});

describe("cabezaTocada", () => {
  const cabezas = [
    { x: 100, y: 100, radio: 40 },
    { x: 400, y: 120, radio: 8 },
  ];

  it("encuentra la cabeza bajo el puntero", () => {
    expect(cabezaTocada({ x: 120, y: 110 }, cabezas)).toBe(0);
  });

  it("las cabezas chicas se pueden tocar sin puntería de cirujano", () => {
    expect(cabezaTocada({ x: 414, y: 128 }, cabezas)).toBe(1);
  });

  it("fuera de las cabezas no toca nada", () => {
    expect(cabezaTocada({ x: 250, y: 300 }, cabezas)).toBe(-1);
  });

  it("si dos se tocan, gana la más cercana", () => {
    const juntas = [
      { x: 100, y: 100, radio: 40 },
      { x: 130, y: 100, radio: 40 },
    ];
    expect(cabezaTocada({ x: 125, y: 100 }, juntas)).toBe(1);
  });
});
