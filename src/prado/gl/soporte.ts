type Lienzo = { getContext(tipo: string): unknown };

/** El prado necesita WebGL2 y poder dibujar en texturas flotantes; si falta algo, va el respaldo estático. */
export function soportaWebGL2(
  crear: () => Lienzo = () => document.createElement("canvas"),
): boolean {
  try {
    const gl = crear().getContext("webgl2") as { getExtension(n: string): unknown } | null;
    if (!gl) return false;
    return gl.getExtension("EXT_color_buffer_float") !== null;
  } catch {
    return false;
  }
}
