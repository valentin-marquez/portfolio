import { describe, expect, it } from "vitest";
import { crearGlFalso } from "./gl-falso";
import { crearObjetivoEscena, crearObjetivoSimple } from "./objetivo";

describe("objetivos de render", () => {
  it("si asignar falla, el siguiente intento del mismo tamaño vuelve a asignar (no queda a medias)", () => {
    const f = crearGlFalso();
    f.gl.getExtension("EXT_color_buffer_float");
    f.estado.completo = false;
    const o = crearObjetivoEscena(f.gl, 0);
    expect(() => o.redimensionar(100, 50)).toThrow(/incompleto/);
    f.estado.completo = true;
    const antes = f.llamadas.get("texImage2D") ?? 0;
    o.redimensionar(100, 50);
    expect(f.llamadas.get("texImage2D") ?? 0).toBeGreaterThan(antes);
  });

  it("lo mismo para el objetivo simple de la profundidad de campo", () => {
    const f = crearGlFalso();
    f.gl.getExtension("EXT_color_buffer_float");
    f.estado.completo = false;
    const o = crearObjetivoSimple(f.gl);
    expect(() => o.redimensionar(100, 50)).toThrow(/incompleto/);
    f.estado.completo = true;
    const antes = f.llamadas.get("texImage2D") ?? 0;
    o.redimensionar(100, 50);
    expect(f.llamadas.get("texImage2D") ?? 0).toBeGreaterThan(antes);
  });
});
