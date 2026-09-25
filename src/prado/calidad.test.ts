import { describe, expect, it } from "vitest";
import { elegirCalidad } from "./calidad";

describe("elegirCalidad", () => {
  it("escritorio con buen equipo: alta", () => {
    expect(elegirCalidad({ anchoCss: 1440, dpr: 2, nucleos: 10 }).nivel).toBe("alta");
  });
  it("pantalla angosta: baja", () => {
    expect(elegirCalidad({ anchoCss: 390, dpr: 3, nucleos: 8 }).nivel).toBe("baja");
  });
  it("pocos núcleos: baja", () => {
    expect(elegirCalidad({ anchoCss: 1440, dpr: 1, nucleos: 4 }).nivel).toBe("baja");
  });
  it("laptop mediana: media", () => {
    expect(elegirCalidad({ anchoCss: 1100, dpr: 1, nucleos: 6 }).nivel).toBe("media");
  });
  it("el DPR nunca pasa de 2", () => {
    for (const nivel of [
      elegirCalidad({ anchoCss: 1440, dpr: 3, nucleos: 16 }),
      elegirCalidad({ anchoCss: 390, dpr: 3, nucleos: 2 }),
    ])
      expect(nivel.dprMax).toBeLessThanOrEqual(2);
  });
});
