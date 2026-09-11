import { describe, expect, test } from "vitest";
import { relacionAspecto, tamañoQueEncaja } from "./medida-texto";

describe("tamañoQueEncaja", () => {
  test("encoge el texto que se sale del ancho disponible", () => {
    // medido a 200 px ocupa 800 de ancho; para caber en 400 hay que ir a 100
    expect(tamañoQueEncaja(800, 200, 400, 300)).toBeCloseTo(100, 6);
  });

  test("no agranda por encima del máximo aunque sobre sitio", () => {
    // con un palabra corta cabría a 900 px, pero el máximo manda
    expect(tamañoQueEncaja(100, 200, 900, 300)).toBe(300);
  });

  test("si ya cabe, se queda en el máximo", () => {
    expect(tamañoQueEncaja(300, 200, 400, 200)).toBe(200);
  });

  test("un ancho medido de cero no revienta ni devuelve infinito", () => {
    // pasa con una cadena vacía o con la fuente aún sin cargar
    expect(tamañoQueEncaja(0, 200, 400, 300)).toBe(300);
  });
});

describe("relacionAspecto", () => {
  test("devuelve alto partido por ancho", () => {
    expect(relacionAspecto(1024, 512)).toBeCloseTo(0.5, 6);
  });

  test("un ancho de cero devuelve 1 en vez de infinito", () => {
    expect(relacionAspecto(0, 512)).toBe(1);
  });
});
