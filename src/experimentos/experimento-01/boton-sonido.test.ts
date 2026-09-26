import { describe, expect, it } from "vitest";
import { accionBotonSonido, VOLUMEN_INICIAL, volumenGuardado } from "./boton-sonido";

describe("accionBotonSonido", () => {
  it("si sonaba al tocarlo, lo silencia", () => {
    expect(accionBotonSonido(true, false)).toBe("silenciar");
  });

  it("si estaba silenciado, lo activa", () => {
    expect(accionBotonSonido(false, true)).toBe("activar");
  });

  it("si todavía no sonaba y no estaba silenciado, no hace nada: el gesto mismo lo arranca", () => {
    // el pointerdown del toque ya arrancó el audio; silenciarlo en el click sería la carrera que
    // deja el botón mudo justo cuando el visitante quería sonido
    expect(accionBotonSonido(false, false)).toBe("nada");
  });
});

describe("volumenGuardado", () => {
  it("lee un número entre 0 y 1", () => {
    expect(volumenGuardado("0.4")).toBe(0.4);
    expect(volumenGuardado("3")).toBe(1);
    expect(volumenGuardado("-1")).toBe(0);
  });

  it("sin dato o con basura vuelve al volumen por defecto", () => {
    expect(volumenGuardado(null)).toBe(VOLUMEN_INICIAL);
    expect(volumenGuardado("abc")).toBe(VOLUMEN_INICIAL);
  });
});
