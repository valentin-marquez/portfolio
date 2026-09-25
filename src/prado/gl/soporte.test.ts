import { describe, expect, it } from "vitest";
import { soportaWebGL2 } from "./soporte";

const lienzo = (contexto: unknown) => () => ({ getContext: () => contexto });

describe("soportaWebGL2", () => {
  it("es falso si el navegador no da contexto webgl2", () => {
    expect(soportaWebGL2(lienzo(null))).toBe(false);
  });

  it("es falso si crear el contexto lanza", () => {
    expect(
      soportaWebGL2(() => ({
        getContext: () => {
          throw new Error("bloqueado");
        },
      })),
    ).toBe(false);
  });

  it("es falso sin buffers de color flotantes (los necesita la profundidad de campo)", () => {
    expect(soportaWebGL2(lienzo({ getExtension: () => null }))).toBe(false);
  });

  it("es verdadero con webgl2 y EXT_color_buffer_float", () => {
    expect(soportaWebGL2(lienzo({ getExtension: () => ({}) }))).toBe(true);
  });
});
