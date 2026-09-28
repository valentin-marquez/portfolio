import { describe, expect, it } from "vitest";
import { barras, enumerar, numeroPase, periodo, trabajos } from "./trabajos";

describe("trabajos", () => {
  it("el periodo dice hasta cuándo, o hoy si sigue vigente", () => {
    expect(periodo({ desde: "2026-04" })).toBe("abr 2026 a hoy");
    expect(periodo({ desde: "2024-03", hasta: "2025-05" })).toBe("mar 2024 a may 2025");
  });

  it("el número del pase es el mes y el año de entrada", () => {
    expect(numeroPase({ desde: "2026-04" })).toBe("0426");
  });

  it("las barras son siempre las mismas y no se salen del código", () => {
    expect(barras("fao")).toEqual(barras("fao"));
    expect(barras("fao")).not.toEqual(barras("framerate"));
    for (const [x, ancho] of barras("bipsolar")) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + ancho).toBeLessThanOrEqual(100);
    }
  });

  it("enumera con coma y la última con y", () => {
    expect(enumerar(["Bun", "Hono", "Docker"])).toBe("Bun, Hono y Docker");
    expect(enumerar(["Bun"])).toBe("Bun");
  });

  it("cada trabajo tiene un id propio", () => {
    expect(new Set(trabajos.map((t) => t.id)).size).toBe(trabajos.length);
  });
});
