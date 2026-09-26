import { describe, expect, it } from "vitest";
import { RETRASO_ENTRADA, TRAMOS, ventanasDe } from "../guion";
import { en } from "../util";
import { aplicarAspecto } from "./dom";
import { aspecto, visibilidad } from "./intercambio";

describe("intercambio", () => {
  it("la salida termina antes de que empiece la entrada siguiente", () => {
    for (let i = 1; i < TRAMOS.length; i++) {
      const sale = en(TRAMOS, i - 1).estado;
      const t = en(TRAMOS, i).desde + RETRASO_ENTRADA;
      expect(visibilidad(t, ventanasDe(sale)), `${sale} en ${t}`).toBeLessThan(0.05);
    }
  });

  it("al final de cada tramo el contenido está entero", () => {
    for (let i = 1; i < TRAMOS.length - 1; i++) {
      const tramo = en(TRAMOS, i);
      const t = en(TRAMOS, i + 1).desde - 0.02;
      expect(visibilidad(t, ventanasDe(tramo.estado)), tramo.estado).toBeGreaterThan(0.99);
    }
  });

  it("el botón está visible al empezar el loop", () => {
    expect(visibilidad(0, ventanasDe("boton"))).toBeGreaterThan(0.99);
  });

  it("un grupo visible no lleva filtro (el texto se vería borroso)", () => {
    const e = { style: { opacity: "", filter: "", transform: "", visibility: "" } };
    aplicarAspecto(e, aspecto(1, 3.6));
    expect(e.style.filter).toBe("none");
    expect(e.style.transform).toBe("scale(1.0000)");
    aplicarAspecto(e, aspecto(0.5, 3.6));
    expect(e.style.filter).toMatch(/^blur\(/);
  });
});
