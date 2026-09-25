// Capa fija a la ventana donde viajan las semillas. La simulación vive en semillas.ts; aquí solo se
// arma el buffer de instancias y se dibujan como sprites procedurales con alfa premultiplicado.

import { crearAzar } from "./azar";
import { FUENTES } from "./fuentes";
import { crearPrograma, ubicaciones } from "./gl/programa";
import { pasoTiempo } from "./motor";
import {
  actualizarSemillas,
  crearSemillas,
  type Punto,
  type Rect,
  type Semilla,
  semillaCercana,
} from "./semillas";
import {
  actualizarSueltas,
  alfaSuelta,
  crearSueltas,
  type Sueltas,
  soltarSemillas,
} from "./semillas-sueltas";

export const FLOTANTES_POR_SEMILLA = 6; // x, y, tamaño, alfa, desenfoque, giro
const CANTIDAD = 6;

/** Sin MSAA: la capa cubre toda la pantalla y sus sprites ya se suavizan en el shader. */
export const ATRIBUTOS_CAPA: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
};

/** Solo se limpia y presenta la pantalla si hay semillas ahora o las hubo en el cuadro anterior. */
export function hayQueDibujar(anteriores: number, actuales: number): boolean {
  return anteriores > 0 || actuales > 0;
}

export interface FuenteCapa {
  progreso(): number;
  viento(): number;
  origenes(): Punto[];
  destinos(): Punto[];
  rectHero(): Rect | null;
  /** la ventana del prado del cierre, donde aterrizan */
  zonaAterrizaje(): Rect | null;
  columna: number;
  reducirMovimiento: boolean;
  /** hacia dónde sopla el viento en pantalla */
  sentido(): 1 | -1;
}

export function instanciasSemillas(
  semillas: Semilla[],
  cercana: { activa: boolean; x: number; y: number; alfa: number },
  rectHero: Rect | null,
  tiempo: number,
  reducir: boolean,
): Float32Array {
  const datos: number[] = [];
  for (const s of semillas) {
    if (s.alfa <= 0.003) continue;
    if (reducir && s.fase === "vuelo") continue;
    const giro = reducir ? 0 : Math.sin(tiempo * 0.7 + s.fasePropia) * 0.25;
    datos.push(s.x, s.y, s.tam, s.alfa, s.desenfoque, giro);
  }
  if (cercana.activa && rectHero && !reducir) {
    datos.push(
      rectHero.left + cercana.x * rectHero.width,
      rectHero.top + cercana.y * rectHero.height,
      46,
      cercana.alfa,
      1,
      Math.sin(tiempo * 0.5) * 0.3,
    );
  }
  return new Float32Array(datos);
}

/** Las semillas que se soltaron al soplar una flor, con el mismo formato que las del recorrido. */
export function instanciasSueltas(s: Sueltas, tiempo: number): Float32Array {
  const datos = new Float32Array(s.lista.length * FLOTANTES_POR_SEMILLA);
  s.lista.forEach((x, i) => {
    const giro = Math.sin(tiempo * 0.9 + x.fase) * 0.35 + x.vx * 0.002;
    datos.set([x.x, x.y, x.tam, alfaSuelta(x), x.desenfoque, giro], i * FLOTANTES_POR_SEMILLA);
  });
  return datos;
}

function unir(a: Float32Array, b: Float32Array): Float32Array {
  if (b.length === 0) return a;
  const c = new Float32Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

function crearRecursos(gl: WebGL2RenderingContext) {
  const prog = crearPrograma(gl, FUENTES.semilla.vert, FUENTES.semilla.frag);
  const u = ubicaciones(gl, prog, ["u_pantalla"] as const);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const bBase = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bBase);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const bInst = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
  const paso = FLOTANTES_POR_SEMILLA * 4;
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, paso, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, paso, 12);
  gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);
  const activar = () => gl.useProgram(prog);

  return {
    dibujar(datos: Float32Array, anchoCss: number, altoCss: number) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const n = datos.length / FLOTANTES_POR_SEMILLA;
      if (n === 0) return;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      activar();
      gl.uniform2f(u.u_pantalla, anchoCss, altoCss);
      gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
      gl.bufferData(gl.ARRAY_BUFFER, datos, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
      gl.bindVertexArray(null);
    },
    destruir() {
      gl.deleteBuffer(bBase);
      gl.deleteBuffer(bInst);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
  };
}

export function montarCapaSemillas(
  canvas: HTMLCanvasElement,
  fuente: FuenteCapa,
): { destruir(): void; soltar(cabeza: Punto, radio: number): void } | null {
  const contexto = canvas.getContext("webgl2", ATRIBUTOS_CAPA);
  if (!contexto) return null;
  const gl = contexto;
  let recursos: ReturnType<typeof crearRecursos> | null = crearRecursos(gl);
  const semillas = crearSemillas(CANTIDAD, 11);
  const sueltas = crearSueltas();
  const azarSueltas = crearAzar(23);
  let raf = 0;
  let anterior: number | null = null;
  let dibujadasAntes = 0;

  function cuadro(ahora: number) {
    raf = requestAnimationFrame(cuadro);
    if (!recursos) return;
    const dt = pasoTiempo(anterior, ahora);
    anterior = ahora;
    const tiempo = ahora / 1000;
    const progreso = fuente.progreso();
    // el tamaño del canvas (sin la barra de scroll) es el del diseño: la columna se centra ahí
    const anchoCss = canvas.clientWidth || window.innerWidth;
    const altoCss = canvas.clientHeight || window.innerHeight;
    actualizarSemillas(semillas, {
      progreso,
      tiempo,
      dt,
      viento: fuente.viento(),
      ancho: anchoCss,
      alto: altoCss,
      columna: fuente.columna,
      origenes: fuente.origenes(),
      destinos: fuente.destinos(),
      zonaAterrizaje: fuente.zonaAterrizaje(),
      reducir: fuente.reducirMovimiento,
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ancho = Math.round(anchoCss * dpr);
    const alto = Math.round(altoCss * dpr);
    if (canvas.width !== ancho || canvas.height !== alto) {
      canvas.width = ancho;
      canvas.height = alto;
    }
    gl.viewport(0, 0, ancho, alto);
    actualizarSueltas(sueltas, dt, fuente.viento(), fuente.sentido());
    const datos = unir(
      instanciasSemillas(
        semillas,
        semillaCercana(tiempo, progreso),
        fuente.rectHero(),
        tiempo,
        fuente.reducirMovimiento,
      ),
      instanciasSueltas(sueltas, tiempo),
    );
    const cantidad = datos.length / FLOTANTES_POR_SEMILLA;
    if (hayQueDibujar(dibujadasAntes, cantidad)) recursos.dibujar(datos, anchoCss, altoCss);
    dibujadasAntes = cantidad;
  }
  raf = requestAnimationFrame(cuadro);

  const alPerder = (ev: Event) => {
    ev.preventDefault();
    recursos = null;
  };
  const alRecuperar = () => {
    recursos = crearRecursos(gl);
  };
  canvas.addEventListener("webglcontextlost", alPerder);
  canvas.addEventListener("webglcontextrestored", alRecuperar);

  return {
    soltar(cabeza, radio) {
      // con movimiento reducido la flor se deshace, pero sus semillas no salen volando
      if (fuente.reducirMovimiento) return;
      const cantidad = Math.round(Math.min(36, Math.max(12, radio * 0.6)));
      soltarSemillas(sueltas, cabeza, radio, cantidad, azarSueltas);
    },
    destruir() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", alPerder);
      canvas.removeEventListener("webglcontextrestored", alRecuperar);
      recursos?.destruir();
      recursos = null;
    },
  };
}
