import { describe, expect, it } from "vitest";
import { brotes } from "./brotes";

describe("brotes", () => {
  it("reparte las briznas a lo ancho de la palabra, sin salirse", () => {
    const briznas = brotes(90, 3);
    expect(briznas.length).toBeGreaterThanOrEqual(10);
    for (const b of briznas) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(90);
      expect(b.alto).toBeGreaterThanOrEqual(4);
      expect(b.alto).toBeLessThanOrEqual(11);
    }
  });

  it("una palabra más ancha lleva más pasto", () => {
    expect(brotes(120, 1).length).toBeGreaterThan(brotes(40, 1).length);
  });

  it("es el mismo pasto cada vez que se pasa el mouse", () => {
    expect(brotes(70, 5)).toEqual(brotes(70, 5));
  });
});
