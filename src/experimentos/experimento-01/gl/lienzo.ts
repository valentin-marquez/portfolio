// El canvas WebGL2: dibuja la forma de manera síncrona en cada seek. El búfer se preserva para que
// las capturas de revisión tomen exactamente este cuadro.
import { CABECERA, crearPrograma, ubicaciones } from "@/prado/gl/programa";
import { crearTriangulo } from "@/prado/gl/triangulo";
import { type Color, crearParametros } from "@/prado/parametros";
import pantallaVert from "@/prado/shaders/pantalla.vert?raw";
import type { Camara } from "../camara";
import { hexARgb } from "../color";
import { COLOR } from "../disposicion";
import type { Forma } from "../forma";
import { D, P } from "../tiempo";
import formaFrag from "./forma.frag?raw";

const UNIFORMES = [
  "uResolucion",
  "uCamara",
  "uCaja",
  "uRadio",
  "uColorCaja",
  "uPieza",
  "uColorPieza",
  "uOpacidadPieza",
  "uArte",
  "uOpacidadArte",
  "uFasePulso",
  "uCiclo",
  "uLienzo",
  "uCieloArriba",
  "uCieloHorizonte",
  "uPastoBase",
  "uPastoCuerpo",
  "uPastoPunta",
] as const;

export interface Lienzo {
  /** `escala`: px físicos por px del cuadrado de 1440, sin contar el zoom de la cámara */
  dibujar(t: number, f: Forma, c: Camara, escala: number): void;
  destruir(): void;
}

/** `capturable`: guarda el búfer entre cuadros (solo lo necesitan las capturas; cuesta rendimiento) */
export function crearLienzo(canvas: HTMLCanvasElement, capturable = false): Lienzo {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: capturable,
  });
  if (!gl) throw new Error("este navegador no tiene WebGL2");
  const programa = crearPrograma(gl, CABECERA + pantallaVert, CABECERA + formaFrag);
  const u = ubicaciones(gl, programa, UNIFORMES);
  const triangulo = crearTriangulo(gl);
  const { cielo, pasto } = crearParametros();
  const rgb = (c: Color) => [c.r, c.g, c.b] as const;

  gl.useProgram(programa);
  gl.uniform3f(u.uLienzo, ...hexARgb(COLOR.lienzo));
  gl.uniform3f(u.uCieloArriba, ...rgb(cielo.arriba));
  gl.uniform3f(u.uCieloHorizonte, ...rgb(cielo.horizonte));
  gl.uniform3f(u.uPastoBase, ...rgb(pasto.tonoBase));
  gl.uniform3f(u.uPastoCuerpo, ...rgb(pasto.tonoCuerpo));
  gl.uniform3f(u.uPastoPunta, ...rgb(pasto.tonoPunta));

  return {
    dibujar(t, f, c, escala) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(programa);
      gl.uniform2f(u.uResolucion, canvas.width, canvas.height);
      gl.uniform3f(u.uCamara, c.x, c.y, c.zoom * escala);
      gl.uniform4f(u.uCaja, f.cx, f.cy, f.w, f.h);
      gl.uniform1f(u.uRadio, f.r);
      gl.uniform3f(u.uColorCaja, ...f.color);
      gl.uniform4f(u.uPieza, f.pieza.L, f.pieza.R, f.pieza.cy, f.pieza.alto);
      gl.uniform3f(u.uColorPieza, ...f.pieza.color);
      gl.uniform1f(u.uOpacidadPieza, f.pieza.opacidad);
      gl.uniform4f(u.uArte, f.arte.x, f.arte.y, f.arte.lado, f.arte.radio);
      gl.uniform1f(u.uOpacidadArte, f.arte.opacidad);
      gl.uniform1f(u.uFasePulso, (t / P) % 1);
      gl.uniform1f(u.uCiclo, t / D);
      triangulo.dibujar();
    },
    destruir() {
      triangulo.destruir();
      gl.deleteProgram(programa);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
