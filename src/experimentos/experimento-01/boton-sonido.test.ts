import { describe, expect, it } from "vitest";
import { accionBotonSonido } from "./boton-sonido";

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
