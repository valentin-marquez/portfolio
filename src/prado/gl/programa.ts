export const CABECERA = "#version 300 es\nprecision highp float;\nprecision highp int;\n";

export function numerarLineas(fuente: string): string {
  return fuente
    .split("\n")
    .map((linea, i) => `${String(i + 1).padStart(4)}| ${linea}`)
    .join("\n");
}

function compilar(gl: WebGL2RenderingContext, tipo: number, fuente: string): WebGLShader {
  const shader = gl.createShader(tipo);
  if (!shader) throw new Error("no se pudo crear el shader");
  gl.shaderSource(shader, fuente);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const nombre = tipo === gl.VERTEX_SHADER ? "vértices" : "fragmentos";
    const log = gl.getShaderInfoLog(shader) ?? "";
    gl.deleteShader(shader);
    throw new Error(`shader de ${nombre}:\n${log}\n${numerarLineas(fuente)}`);
  }
  return shader;
}

export function crearPrograma(
  gl: WebGL2RenderingContext,
  vert: string,
  frag: string,
): WebGLProgram {
  const v = compilar(gl, gl.VERTEX_SHADER, vert);
  const f = compilar(gl, gl.FRAGMENT_SHADER, frag);
  const programa = gl.createProgram();
  if (!programa) throw new Error("no se pudo crear el programa");
  gl.attachShader(programa, v);
  gl.attachShader(programa, f);
  gl.linkProgram(programa);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`enlace del programa:\n${gl.getProgramInfoLog(programa) ?? ""}`);
  }
  return programa;
}

export function ubicaciones<T extends string>(
  gl: WebGL2RenderingContext,
  programa: WebGLProgram,
  nombres: readonly T[],
): Record<T, WebGLUniformLocation | null> {
  const u = {} as Record<T, WebGLUniformLocation | null>;
  for (const n of nombres) u[n] = gl.getUniformLocation(programa, n);
  return u;
}
