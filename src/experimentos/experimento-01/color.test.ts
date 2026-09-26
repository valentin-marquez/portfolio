import { describe, expect, it } from "vitest";
import { hexARgb, mezclarCss, oklabARgb, pistaColor, rgbAOklab } from "./color";
import { R } from "./resortes";
import { D } from "./tiempo";

describe("color", () => {
  it("hex → sRGB", () => {
    expect(hexARgb("#66794a")).toEqual([0x66 / 255, 0x79 / 255, 0x4a / 255]);
  });

  it("ida y vuelta por OKLab sin pérdida", () => {
    for (const hex of ["#66794a", "#111110", "#ffffff", "#d6d2c6"]) {
      const c = hexARgb(hex);
      const vuelta = oklabARgb(rgbAOklab(c));
      c.forEach((v, i) => expect(vuelta[i]).toBeCloseTo(v, 6));
    }
  });

  it("entre negro y blanco pasa por grises neutros", () => {
    const f = pistaColor([
      { t: 1, color: "#ffffff", r: R.firme },
      { t: 10, color: "#000000", r: R.firme },
    ]);
    const [r, g, b] = f(1.05);
    expect(r).toBeGreaterThan(0.05);
    expect(r).toBeLessThan(0.95);
    expect(g).toBeCloseTo(r, 4);
    expect(b).toBeCloseTo(r, 4);
    expect(f(D - 1e-6)[0]).toBeCloseTo(f(0)[0], 3);
  });

  it("mezclarCss va de un color al otro", () => {
    expect(mezclarCss("#000000", "#ffffff", 0)).toBe("rgb(0 0 0)");
    expect(mezclarCss("#000000", "#ffffff", 1)).toBe("rgb(255 255 255)");
  });
});
