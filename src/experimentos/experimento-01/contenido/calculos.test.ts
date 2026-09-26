import { describe, expect, it } from "vitest";
import { cubrimiento, formatoMiles, formatoTiempo } from "./calculos";
import { playPausa } from "./iconos";

describe("calculos", () => {
  it("formatoTiempo", () => {
    expect(formatoTiempo(82.4)).toBe("1:22");
    expect(formatoTiempo(-77.2)).toBe("-1:17");
    expect(formatoTiempo(5)).toBe("0:05");
  });

  it("formatoMiles con punto, como en Chile", () => {
    expect(formatoMiles(84320)).toBe("84.320");
    expect(formatoMiles(999)).toBe("999");
    expect(formatoMiles(1234567.4)).toBe("1.234.567");
  });

  it("cubrimiento de una etiqueta por la pieza", () => {
    expect(cubrimiento(-10, 10, 0, 5)).toBe(1);
    expect(cubrimiento(20, 40, 0, 5)).toBe(0);
    expect(cubrimiento(0, 10, 0, 5)).toBeCloseTo(0.5, 9);
  });

  it("play/pausa interpola dos cuadriláteros", () => {
    expect(playPausa(1).match(/M/g)).toHaveLength(2);
    expect(playPausa(0)).toContain("7.000 4.500");
    expect(playPausa(1)).toContain("6.500 5.000");
  });
});
