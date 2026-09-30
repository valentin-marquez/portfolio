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

describe("descifrar", () => {
  it("revuelve al principio y termina en el texto final, con el mismo largo", async () => {
    const { descifrar } = await import("./medidas");
    const { azar } = await import("./tiempo");
    const r = azar(3);
    expect(descifrar("Pass granted!", 0, r)).not.toBe("Pass granted!");
    expect(descifrar("Pass granted!", 1, r)).toBe("Pass granted!");
    expect(descifrar("Pass granted!", 0.5, r)).toHaveLength("Pass granted!".length);
    expect(descifrar("Pass granted!", 0.5, r).startsWith("Pass g")).toBe(true);
  });
});

describe("distanciaPara", () => {
  it("la tarjeta 3D mide en pantalla lo mismo que la del DOM", async () => {
    const { distanciaPara } = await import("./medidas");
    const d = distanciaPara(686, 900, 30, 43);
    const visible = 2 * d * Math.tan((30 * Math.PI) / 360);
    expect((43 / visible) * 900).toBeCloseTo(686, 6);
  });
});

describe("pasoReloj", () => {
  it("nunca retrocede y tiene tope de 50 ms", async () => {
    const { pasoReloj } = await import("./medidas");
    expect(pasoReloj(100, 116)).toBe(0); // el timestamp del cuadro puede ser anterior a performance.now()
    expect(pasoReloj(116, 100)).toBeCloseTo(0.016, 6);
    expect(pasoReloj(9000, 100)).toBe(0.05); // al volver de una pestaña oculta
  });
});

describe("conPlazo", () => {
  it("devuelve null si la promesa no llega a tiempo, y el valor si llega", async () => {
    const { conPlazo } = await import("./medidas");
    expect(await conPlazo(new Promise<number>(() => {}), 20)).toBeNull();
    expect(await conPlazo(Promise.resolve(7), 20)).toBe(7);
    expect(await conPlazo(Promise.reject(new Error("x")), 20)).toBeNull();
  });
});
