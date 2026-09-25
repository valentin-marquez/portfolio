import { describe, expect, it } from "vitest";
import { pasoTiempo } from "./motor";

describe("pasoTiempo", () => {
  it("el primer cuadro no avanza el tiempo", () => {
    expect(pasoTiempo(null, 1234)).toBe(0);
  });

  it("un cuadro normal avanza lo que dura", () => {
    expect(pasoTiempo(1000, 1016)).toBeCloseTo(0.016, 6);
  });

  it("al volver de una pestaña oculta (10 min) el paso queda acotado y nada salta", () => {
    expect(pasoTiempo(0, 600_000)).toBe(0.05);
  });

  it("si el reloj retrocede, el paso es cero", () => {
    expect(pasoTiempo(2000, 1000)).toBe(0);
  });
});
