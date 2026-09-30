import { describe, expect, it } from "vitest";
import { escalaTarjeta } from "./medidas";

describe("medidas", () => {
  it("en escritorio la tarjeta va a tamaño real", () => {
    expect(escalaTarjeta(480, 686, 1440, 900)).toBe(1);
  });

  it("en un teléfono de 360 se achica para caber de ancho, con 16 px por lado", () => {
    expect(escalaTarjeta(480, 686, 360, 700) * 480).toBeCloseTo(328, 6);
  });

  it("en una ventana baja se achica para caber de alto, con el cromo y el aviso", () => {
    expect(escalaTarjeta(480, 686, 1440, 600) * 686).toBeCloseTo(600 - 96, 6);
  });
});
