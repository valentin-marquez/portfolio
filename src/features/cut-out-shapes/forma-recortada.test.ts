import { describe, expect, test } from "vitest";
import { interiorDesigual, rectanguloIrregular } from "./forma-recortada";

const ANCHO = 1;
const ALTO = 0.4;

const lados = (p: readonly (readonly [number, number])[]) =>
  p.map((punto, i) => {
    const siguiente = p[(i + 1) % p.length];
    if (!siguiente) throw new Error("polígono incompleto");
    return Math.hypot(siguiente[0] - punto[0], siguiente[1] - punto[1]);
  });

describe("rectanguloIrregular", () => {
  test("devuelve cuatro esquinas", () => {
    expect(rectanguloIrregular(ANCHO, ALTO, 1, 7)).toHaveLength(4);
  });

  test("sin irregularidad es un rectángulo exacto", () => {
    const p = rectanguloIrregular(ANCHO, ALTO, 0, 7);

    expect(p[0]).toEqual([-ANCHO / 2, ALTO / 2]);
    expect(p[1]).toEqual([ANCHO / 2, ALTO / 2]);
    expect(p[2]).toEqual([ANCHO / 2, -ALTO / 2]);
    expect(p[3]).toEqual([-ANCHO / 2, -ALTO / 2]);
  });

  test("con irregularidad ninguna esquina se queda en su sitio", () => {
    // "nunca es una caja" es la técnica entera: si alguna esquina queda recta,
    // la forma delata que es un rectángulo disfrazado
    const recto = rectanguloIrregular(ANCHO, ALTO, 0, 7);
    const torcido = rectanguloIrregular(ANCHO, ALTO, 1, 7);

    for (let i = 0; i < 4; i++) {
      expect(torcido[i]).not.toEqual(recto[i]);
    }
  });

  test("ningún par de lados mide lo mismo", () => {
    const medidas = lados(rectanguloIrregular(ANCHO, ALTO, 1, 7));
    expect(new Set(medidas.map((m) => m.toFixed(6))).size).toBe(4);
  });

  test("la misma semilla da la misma forma", () => {
    expect(rectanguloIrregular(ANCHO, ALTO, 1, 7)).toEqual(rectanguloIrregular(ANCHO, ALTO, 1, 7));
  });

  test("semillas distintas dan formas distintas", () => {
    expect(rectanguloIrregular(ANCHO, ALTO, 1, 7)).not.toEqual(
      rectanguloIrregular(ANCHO, ALTO, 1, 8),
    );
  });
});

describe("interiorDesigual", () => {
  const exterior = rectanguloIrregular(ANCHO, ALTO, 1, 7);

  test("el interior cabe dentro del exterior", () => {
    const interior = interiorDesigual(exterior, 0.03, 7);
    const areas = (p: readonly (readonly [number, number])[]) => {
      let a = 0;
      for (let i = 0; i < p.length; i++) {
        const u = p[i];
        const v = p[(i + 1) % p.length];
        if (!u || !v) throw new Error("polígono incompleto");
        a += u[0] * v[1] - v[0] * u[1];
      }
      return Math.abs(a / 2);
    };

    expect(areas(interior)).toBeLessThan(areas(exterior));
  });

  test("se recorta distinto en cada lado", () => {
    // aquí está el aspecto de recorte a mano: un borde uniforme delata el CSS
    const interior = interiorDesigual(exterior, 0.03, 7);
    const desplazamientos = interior.map((punto, i) => {
      const fuera = exterior[i];
      if (!fuera) throw new Error("polígono incompleto");
      return Math.hypot(punto[0] - fuera[0], punto[1] - fuera[1]).toFixed(6);
    });

    expect(new Set(desplazamientos).size).toBe(4);
  });

  test("un grosor cero deja el interior pegado al exterior", () => {
    expect(interiorDesigual(exterior, 0, 7)).toEqual(exterior);
  });
});
