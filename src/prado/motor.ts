// Motor del prado: WebGL2 escrito a mano, sin React. Dibuja cielo, pasto y dientes de león en un
// objetivo con MSAA y dos salidas (color + profundidad) y compone el resultado en el canvas con los
// bordes disueltos. React solo lo monta y le pasa el scroll y el puntero.
import { aplicarAtmosfera, atmosferaEn, copiarParametros, type Efectos } from "./atmosfera";
import { crearAzar } from "./azar";
import { estadoCabeza } from "./cabezas";
import type { Calidad } from "./calidad";
import {
  invertir,
  type Mat4,
  mirarA,
  multiplicar,
  perspectiva,
  proyectar,
  rayoAPlano,
  type Vec3,
} from "./camara";
import { FUENTES } from "./fuentes";
import { crearObjetivoEscena, crearObjetivoSimple } from "./gl/objetivo";
import { crearPrograma, ubicaciones } from "./gl/programa";
import { crearTriangulo } from "./gl/triangulo";
import type { Color, Parametros } from "./parametros";
import {
  type Diente,
  FLOTANTES_POR_HOJA,
  generarDientes,
  generarHojas,
  instanciasTallos,
  mallaHoja,
  puntaDiente,
} from "./pasto";
import { actualizarRastro, crearRastro, uniformeRastro } from "./rastro";
import { influenciaScroll, type Rafaga, rafaga, sentidoActual } from "./viento";
import {
  avanzarEnjambre,
  crearEnjambre,
  escribirInstancias,
  FLOTANTES_POR_VOLADOR,
  MAX_VOLADORES,
} from "./voladores";

export interface OpcionesPrado {
  semilla: number;
  /** cuántos dientes de león repartir, o la lista exacta de flores puestas a mano */
  dientes: number | Diente[];
  /** foco propio de esta ventana (por ejemplo, poco profundo para una flor de cerca) */
  foco?: Partial<Parametros["foco"]>;
  /** radio de las cabezas en esta ventana (m) */
  radioCabeza?: number;
  /** cuántas mariposas y hojas caben como máximo en esta ventana, y entre qué distancias vuelan */
  voladores?: { mariposas: number; hojas: number; cerca?: number; lejos?: number };
  /** compartido y mutable: el panel de depuración lo cambia en vivo */
  parametros: Parametros;
  calidad: Calidad;
  reducirMovimiento: boolean;
  /** avisa cuando el prado deja de dibujarse (contexto perdido o fallo) y cuando vuelve */
  alCambiarEstado?: (estado: EstadoPrado) => void;
  /** cada cuadro la página puede mover la cámara (por ejemplo, según el scroll) */
  ajustarCamara?: (base: Parametros["camara"]) => Parametros["camara"];
}

export type EstadoPrado = "activo" | "perdido" | "fallido";

export interface Prado {
  fijarScroll(velocidadPx: number): void;
  /** en pausa no se dibuja (por ejemplo, mientras el contenido lo tapa por completo) */
  fijarEnPausa(pausa: boolean): void;
  /** px CSS relativos al canvas; NaN cuando el puntero sale */
  fijarPuntero(x: number, y: number): void;
  /** cabezas de los dientes de león en px de viewport, con su radio en pantalla */
  cabezasEnPantalla(): Array<{ x: number; y: number; radio: number }>;
  /** sopla un diente de león: se deshace, queda pelado un rato y vuelve a llenarse */
  soplar(indice: number): void;
  /** cuánto ha perdido cada cabeza (0..1) por las semillas que se fueron con el scroll */
  desprender(fracciones: ArrayLike<number>): void;
  destruir(): void;
}

/** Segundos desde el cuadro anterior, acotado: al volver de una pestaña oculta nada salta. */
export function pasoTiempo(anteriorMs: number | null, ahoraMs: number): number {
  if (anteriorMs === null) return 0;
  return Math.min(0.05, Math.max(0, (ahoraMs - anteriorMs) / 1000));
}

/** La ráfaga que ve el pasto: la misma línea de tiempo que el latido del audio y las semillas. */
export function rafagaDelPrado(ahoraMs: number): Rafaga {
  return rafaga(ahoraMs / 1000);
}

/** Con entradas acumuladas del IntersectionObserver manda la más reciente. */
export function visibleSegun(entradas: ReadonlyArray<{ isIntersecting: boolean }>): boolean {
  return entradas[entradas.length - 1]?.isIntersecting ?? false;
}

/** El navegador olvida las extensiones al perder el contexto: hay que pedirla al montar y al recuperar. */
const tieneColorFlotante = (gl: WebGL2RenderingContext) =>
  gl.getExtension("EXT_color_buffer_float") !== null;

/** cuántas cabezas puede seguir el shader (u_deshecho) */
const MAX_CABEZAS = 8;

const NOMBRES_HOJA = [
  "u_vistaProy",
  "u_camara",
  "u_tiempo",
  "u_rafaga",
  "u_extra",
  "u_puntero",
  "u_viento",
  "u_movimiento",
  "u_torsion",
  "u_rastro",
] as const;

interface EstadoCuadro {
  vp: Mat4;
  inversa: Mat4;
  ojo: Vec3;
  tiempo: number;
  rafaga: Rafaga;
  extra: number;
  puntero: [number, number, number, number];
  rastro: Float32Array;
  /** cuánto se deshizo cada cabeza (0 llena, 1 pelada) */
  deshecho: Float32Array;
  movimiento: number;
  ancho: number;
  alto: number;
  dpr: number;
  fov: number;
  /** lo que el clima agrega en este cuadro */
  efectos: Efectos;
  /** mariposas y hojas: cuántas hay y sus instancias ya escritas */
  voladores: number;
  datosVoladores: Float32Array;
}

/** tope de partículas de lluvia o nieve; la calidad lo achica */
const MAX_PARTICULAS = 4200;
const MAX_MOTAS = 320;

function crearVaoInstancias(
  gl: WebGL2RenderingContext,
  base: Float32Array,
  instancias: Float32Array,
) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const bBase = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bBase);
  gl.bufferData(gl.ARRAY_BUFFER, base, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const bInst = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
  gl.bufferData(gl.ARRAY_BUFFER, instancias, gl.STATIC_DRAW);
  const paso = FLOTANTES_POR_HOJA * 4;
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, paso, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, paso, 16);
  gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);
  return {
    vao,
    cantidad: instancias.length / FLOTANTES_POR_HOJA,
    destruir() {
      gl.deleteBuffer(bBase);
      gl.deleteBuffer(bInst);
      gl.deleteVertexArray(vao);
    },
  };
}

/** Un cuadrilátero por partícula; cada una con su lugar en la caja (0..1) y un azar propio. */
function crearVaoParticulas(gl: WebGL2RenderingContext, cantidad: number, semilla: number) {
  const azar = crearAzar(semilla * 31 + 5);
  const semillas = new Float32Array(cantidad * 4);
  for (let i = 0; i < semillas.length; i++) semillas[i] = azar();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const bBase = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bBase);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const bInst = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
  gl.bufferData(gl.ARRAY_BUFFER, semillas, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.bindVertexArray(null);
  return {
    vao,
    cantidad,
    destruir() {
      gl.deleteBuffer(bBase);
      gl.deleteBuffer(bInst);
      gl.deleteVertexArray(vao);
    },
  };
}

/** Dos alas (dos cuadriláteros que nacen del eje del cuerpo) y las instancias que la CPU reescribe. */
function crearVaoVoladores(gl: WebGL2RenderingContext) {
  const malla: number[] = [];
  for (const lado of [-1, 1]) {
    // u (0 en el cuerpo, 1 en la punta), v (-1 atrás, 1 adelante)
    const q = [
      [0, -1],
      [1, -1],
      [0, 1],
      [0, 1],
      [1, -1],
      [1, 1],
    ];
    for (const [u, v] of q) malla.push(u as number, v as number, lado);
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const bBase = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bBase);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(malla), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  const bInst = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
  gl.bufferData(gl.ARRAY_BUFFER, MAX_VOLADORES * FLOTANTES_POR_VOLADOR * 4, gl.DYNAMIC_DRAW);
  const paso = FLOTANTES_POR_VOLADOR * 4;
  for (let k = 0; k < 3; k++) {
    gl.enableVertexAttribArray(1 + k);
    gl.vertexAttribPointer(1 + k, 4, gl.FLOAT, false, paso, k * 16);
    gl.vertexAttribDivisor(1 + k, 1);
  }
  gl.bindVertexArray(null);
  return {
    vao,
    subir(datos: Float32Array, n: number) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, datos, 0, n * FLOTANTES_POR_VOLADOR);
    },
    destruir() {
      gl.deleteBuffer(bBase);
      gl.deleteBuffer(bInst);
      gl.deleteVertexArray(vao);
    },
  };
}

function normalizar(v: Vec3): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

function crearRecursos(gl: WebGL2RenderingContext, op: OpcionesPrado, aspecto: number) {
  // lo que se dibuja: los parámetros de la página vestidos con la atmósfera de cada cuadro
  const p = copiarParametros(op.parametros);
  const programa = (f: { vert: string; frag: string }) => crearPrograma(gl, f.vert, f.frag);
  const progCielo = programa(FUENTES.cielo);
  const progPasto = programa(FUENTES.pasto);
  const progDiente = programa(FUENTES.diente);
  const progDof = programa(FUENTES.dof);
  const progComp = programa(FUENTES.composicion);
  const progParticula = programa(FUENTES.particula);
  const progVolador = programa(FUENTES.volador);
  const uCielo = ubicaciones(gl, progCielo, [
    "u_inversa",
    "u_camara",
    "u_sol",
    "u_colorSol",
    "u_cieloArriba",
    "u_cieloHorizonte",
    "u_bruma",
    "u_densidadBruma",
    "u_tonoSuelo",
    "u_nubes",
    "u_nubosidad",
    "u_destello",
  ] as const);
  const uPasto = ubicaciones(gl, progPasto, [
    ...NOMBRES_HOJA,
    "u_tonoBase",
    "u_tonoCuerpo",
    "u_tonoPunta",
    "u_tonoTallo",
    "u_sol",
    "u_colorSol",
    "u_ambiente",
    "u_translucidez",
    "u_bruma",
    "u_densidadBruma",
    "u_vista",
    "u_nubes",
    "u_nubosidad",
    "u_escarcha",
  ] as const);
  const uDiente = ubicaciones(gl, progDiente, [
    ...NOMBRES_HOJA,
    "u_aspecto",
    "u_radioCabeza",
    "u_colorSol",
    "u_bruma",
    "u_densidadBruma",
    "u_anchoPx",
    "u_deshecho",
  ] as const);
  const uDof = ubicaciones(gl, progDof, [
    "u_color",
    "u_prof",
    "u_texel",
    "u_foco",
    "u_rango",
    "u_radioMax",
    "u_muestras",
  ] as const);
  const uParticula = ubicaciones(gl, progParticula, [
    "u_vistaProy",
    "u_camara",
    "u_tiempo",
    "u_modo",
    "u_deriva",
    "u_tanMedio",
    "u_aspecto",
    "u_altoPx",
    "u_opacidad",
    "u_sol",
    "u_colorSol",
    "u_colorMotas",
    "u_bruma",
    "u_densidadBruma",
  ] as const);
  const uVolador = ubicaciones(gl, progVolador, [
    "u_vistaProy",
    "u_camara",
    "u_sol",
    "u_colorSol",
    "u_ambiente",
    "u_bruma",
    "u_densidadBruma",
  ] as const);
  const uComp = ubicaciones(gl, progComp, [
    "u_dof",
    "u_prof",
    "u_borde",
    "u_ruidoBorde",
    "u_grano",
    "u_tiempo",
    "u_foco",
    "u_rango",
    "u_vista",
  ] as const);

  const malla = mallaHoja(6);
  const verticesHoja = malla.length / 2;
  // las hojas se generan una vez con un aspecto generoso, así redimensionar no las regenera
  const pasto = crearVaoInstancias(
    gl,
    malla,
    generarHojas(op.calidad.hojas, p.pasto, p.camara.fov, 2.2, op.semilla),
  );
  const dientes: Diente[] = Array.isArray(op.dientes)
    ? op.dientes
    : generarDientes(op.dientes, p, aspecto, op.semilla);
  const focoActual = () => ({ ...p.foco, ...op.foco });
  const datosTallos = instanciasTallos(dientes);
  const tallos = crearVaoInstancias(gl, malla, datosTallos);
  const cabezas = crearVaoInstancias(
    gl,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    datosTallos,
  );
  const maxParticulas = Math.round(MAX_PARTICULAS * Math.min(1, op.calidad.hojas / 60000 + 0.3));
  const particulas = crearVaoParticulas(gl, maxParticulas, op.semilla);
  const voladores = crearVaoVoladores(gl);
  const escena = crearObjetivoEscena(gl, op.calidad.msaa);
  const desenfoque = crearObjetivoSimple(gl);
  const triangulo = crearTriangulo(gl);

  const usar = (prog: WebGLProgram) => gl.useProgram(prog);
  const c3 = (u: WebGLUniformLocation | null, c: Color) => gl.uniform3f(u, c.r, c.g, c.b);
  const v3 = (u: WebGLUniformLocation | null, v: Vec3) => gl.uniform3f(u, v.x, v.y, v.z);

  function fijarHoja(
    u: Record<(typeof NOMBRES_HOJA)[number], WebGLUniformLocation | null>,
    e: EstadoCuadro,
  ) {
    gl.uniformMatrix4fv(u.u_vistaProy, false, e.vp);
    v3(u.u_camara, e.ojo);
    gl.uniform1f(u.u_tiempo, e.tiempo);
    gl.uniform2f(u.u_rafaga, e.rafaga.fuerza, e.rafaga.frente);
    gl.uniform1f(u.u_extra, e.extra);
    gl.uniform4f(u.u_puntero, ...e.puntero);
    gl.uniform4fv(u.u_rastro, e.rastro);
    gl.uniform3f(u.u_viento, p.viento.escalaRuido, p.viento.fuerzaRuido, p.viento.fuerzaRafaga);
    gl.uniform1f(u.u_movimiento, e.movimiento);
    gl.uniform1f(u.u_torsion, p.pasto.torsion);
  }

  function dibujarEscena(e: EstadoCuadro) {
    const sol = normalizar(p.luz.sol);
    // las sombras de nubes viajan con el viento (hacia +x, un poco hacia el fondo)
    const nubes: [number, number] = [e.tiempo * 0.55, -e.tiempo * 0.14];
    escena.usar();
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    // cielo y suelo lejano, sin prueba de profundidad
    gl.disable(gl.DEPTH_TEST);
    usar(progCielo);
    gl.uniformMatrix4fv(uCielo.u_inversa, false, e.inversa);
    v3(uCielo.u_camara, e.ojo);
    v3(uCielo.u_sol, sol);
    c3(uCielo.u_colorSol, p.luz.colorSol);
    c3(uCielo.u_cieloArriba, p.cielo.arriba);
    c3(uCielo.u_cieloHorizonte, p.cielo.horizonte);
    c3(uCielo.u_bruma, p.bruma.color);
    gl.uniform1f(uCielo.u_densidadBruma, p.bruma.densidad);
    c3(uCielo.u_tonoSuelo, p.pasto.tonoSuelo);
    gl.uniform2f(uCielo.u_nubes, ...nubes);
    gl.uniform1f(uCielo.u_nubosidad, e.efectos.nubosidad);
    gl.uniform1f(uCielo.u_destello, e.efectos.destello);
    triangulo.dibujar();

    // pasto y tallos
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    usar(progPasto);
    fijarHoja(uPasto, e);
    c3(uPasto.u_tonoBase, p.pasto.tonoBase);
    c3(uPasto.u_tonoCuerpo, p.pasto.tonoCuerpo);
    c3(uPasto.u_tonoPunta, p.pasto.tonoPunta);
    c3(uPasto.u_tonoTallo, p.pasto.tonoTallo);
    v3(uPasto.u_sol, sol);
    c3(uPasto.u_colorSol, p.luz.colorSol);
    c3(uPasto.u_ambiente, p.luz.ambiente);
    gl.uniform1f(uPasto.u_translucidez, p.luz.translucidez);
    c3(uPasto.u_bruma, p.bruma.color);
    gl.uniform1f(uPasto.u_densidadBruma, p.bruma.densidad);
    gl.uniform1i(uPasto.u_vista, p.vista);
    gl.uniform2f(uPasto.u_nubes, ...nubes);
    gl.uniform1f(uPasto.u_nubosidad, e.efectos.nubosidad);
    gl.uniform1f(uPasto.u_escarcha, e.efectos.escarcha);
    gl.bindVertexArray(pasto.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, verticesHoja, pasto.cantidad);
    gl.bindVertexArray(tallos.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, verticesHoja, tallos.cantidad);

    // cabezas de los dientes de león
    usar(progDiente);
    fijarHoja(uDiente, e);
    gl.uniform1f(uDiente.u_aspecto, e.ancho / e.alto);
    gl.uniform1f(uDiente.u_radioCabeza, op.radioCabeza ?? p.diente.radioCabeza);
    c3(uDiente.u_colorSol, p.luz.colorSol);
    c3(uDiente.u_bruma, p.bruma.color);
    gl.uniform1f(uDiente.u_densidadBruma, p.bruma.densidad);
    gl.uniform1f(uDiente.u_anchoPx, e.ancho);
    gl.uniform1fv(uDiente.u_deshecho, e.deshecho);
    // las cabezas son translúcidas: se mezclan con alfa premultiplicado sobre el pasto ya dibujado
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(cabezas.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cabezas.cantidad);

    // mariposas y hojas: como las cabezas, translúcidas en el borde y con su propia profundidad
    if (e.voladores > 0) {
      usar(progVolador);
      gl.uniformMatrix4fv(uVolador.u_vistaProy, false, e.vp);
      v3(uVolador.u_camara, e.ojo);
      v3(uVolador.u_sol, sol);
      c3(uVolador.u_colorSol, p.luz.colorSol);
      c3(uVolador.u_ambiente, p.luz.ambiente);
      c3(uVolador.u_bruma, p.bruma.color);
      gl.uniform1f(uVolador.u_densidadBruma, p.bruma.densidad);
      voladores.subir(e.datosVoladores, e.voladores);
      gl.bindVertexArray(voladores.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 12, e.voladores);
    }

    // lo que cae o flota: detrás del pasto se esconde, pero no tapa a nadie en la profundidad
    const lluvia = Math.round(particulas.cantidad * 0.5 * e.efectos.lluvia);
    const nieve = Math.round(particulas.cantidad * 0.7 * e.efectos.nieve);
    const motas = Math.round(Math.min(MAX_MOTAS, particulas.cantidad) * e.efectos.motas);
    if (lluvia + nieve + motas > 0) {
      gl.depthMask(false);
      usar(progParticula);
      gl.uniformMatrix4fv(uParticula.u_vistaProy, false, e.vp);
      v3(uParticula.u_camara, e.ojo);
      gl.uniform1f(uParticula.u_tiempo, e.tiempo);
      gl.uniform1f(uParticula.u_deriva, sentidoActual() * (0.5 + e.rafaga.fuerza * 3));
      gl.uniform1f(uParticula.u_tanMedio, Math.tan((e.fov * Math.PI) / 360));
      gl.uniform1f(uParticula.u_aspecto, e.ancho / e.alto);
      gl.uniform1f(uParticula.u_altoPx, e.alto);
      v3(uParticula.u_sol, sol);
      c3(uParticula.u_colorSol, p.luz.colorSol);
      c3(uParticula.u_colorMotas, e.efectos.colorMotas);
      c3(uParticula.u_bruma, p.bruma.color);
      gl.uniform1f(uParticula.u_densidadBruma, p.bruma.densidad);
      gl.bindVertexArray(particulas.vao);
      const tandas: Array<[number, number, number]> = [
        [2, motas, 1],
        [0, lluvia, Math.min(1, 0.55 + e.efectos.lluvia)],
        [1, nieve, 1],
      ];
      for (const [modo, cantidad, opacidad] of tandas) {
        if (cantidad <= 0) continue;
        gl.uniform1i(uParticula.u_modo, modo);
        gl.uniform1f(uParticula.u_opacidad, opacidad);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cantidad);
      }
      gl.depthMask(true);
    }

    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    escena.resolver();
  }

  function enfocar(e: EstadoCuadro, foco: number) {
    desenfoque.usar();
    usar(progDof);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, escena.texColor);
    gl.uniform1i(uDof.u_color, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, escena.texProf);
    gl.uniform1i(uDof.u_prof, 1);
    gl.uniform2f(uDof.u_texel, 1 / e.ancho, 1 / e.alto);
    gl.uniform1f(uDof.u_foco, foco);
    gl.uniform1f(uDof.u_rango, focoActual().rango);
    gl.uniform1f(uDof.u_radioMax, focoActual().radioMax * e.dpr);
    gl.uniform1i(uDof.u_muestras, op.calidad.muestrasDof);
    triangulo.dibujar();
  }

  function componer(e: EstadoCuadro, color: WebGLTexture, foco: number) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, e.ancho, e.alto);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    usar(progComp);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, color);
    gl.uniform1i(uComp.u_dof, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, escena.texProf);
    gl.uniform1i(uComp.u_prof, 1);
    gl.uniform2f(uComp.u_borde, p.borde.x, p.borde.y);
    gl.uniform1f(uComp.u_ruidoBorde, p.borde.ruido);
    gl.uniform1f(uComp.u_grano, p.grano);
    gl.uniform1f(uComp.u_tiempo, e.tiempo);
    gl.uniform1f(uComp.u_foco, foco);
    gl.uniform1f(uComp.u_rango, focoActual().rango);
    gl.uniform1i(uComp.u_vista, p.vista);
    triangulo.dibujar();
  }

  return {
    dientes,
    /** los parámetros vestidos que se dibujan; el motor los rellena cada cuadro */
    parametros: p,
    dibujar(e: EstadoCuadro) {
      // el foco respira apenas, y se abre un poco con cada ráfaga
      const f = focoActual();
      const r = f.respiracion;
      const distancia =
        f.distancia * (1 + 0.03 * Math.sin(e.tiempo * 0.2) * r) + e.rafaga.fuerza * r;
      dibujarEscena(e);
      enfocar(e, distancia);
      componer(e, desenfoque.tex, distancia);
    },
    redimensionar(ancho: number, alto: number) {
      escena.redimensionar(ancho, alto);
      desenfoque.redimensionar(ancho, alto);
    },
    destruir() {
      for (const r of [
        pasto,
        tallos,
        cabezas,
        particulas,
        voladores,
        escena,
        desenfoque,
        triangulo,
      ])
        r.destruir();
      for (const prog of [
        progCielo,
        progPasto,
        progDiente,
        progDof,
        progComp,
        progParticula,
        progVolador,
      ])
        gl.deleteProgram(prog);
    },
  };
}

type Recursos = ReturnType<typeof crearRecursos>;

export function montarPrado(canvas: HTMLCanvasElement, op: OpcionesPrado): Prado | null {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl || !tieneColorFlotante(gl)) return null;
  const p = op.parametros;
  const avisar = (estado: EstadoPrado) => op.alCambiarEstado?.(estado);
  const aspectoActual = () => Math.max(0.5, canvas.clientWidth / Math.max(1, canvas.clientHeight));

  let recursos: Recursos | null = crearRecursos(gl, op, aspectoActual());
  let raf = 0;
  let anterior: number | null = null;
  let visible = false;
  let perdido = false;
  let fallido = false;
  let enPausa = false;
  let tiempo = 0;
  let extra = 0;
  let velocidad = 0;
  let puntero: { x: number; y: number } | null = null;
  let bajoCursor = { x: 0, z: 0 };
  const rastro = crearRastro();
  let fuerzaPuntero = 0;
  let ultimaVp: Mat4 | null = null;
  // segundos (reloj de la página) en que se sopló cada cabeza; null si nunca
  const sopladas: Array<number | null> = [];
  let ahoraS = 0;
  const deshecho = new Float32Array(MAX_CABEZAS);
  const desprendidas = new Float32Array(MAX_CABEZAS);
  // mariposas y hojas: viven en la CPU, así sobreviven a una pérdida del contexto
  const enjambre = crearEnjambre(op.semilla);
  const datosVoladores = new Float32Array(MAX_VOLADORES * FLOTANTES_POR_VOLADOR);
  const maxVoladores = op.voladores ?? { mariposas: 3, hojas: 7 };
  const radioCabeza = op.radioCabeza ?? p.diente.radioCabeza;
  // una mariposa se posa arriba de la cabeza de un diente de león
  const floresDe = (r: Recursos) =>
    r.dientes.map((d, i) => {
      const punta = puntaDiente(d, i);
      return { ...punta, y: punta.y + radioCabeza * 0.75 };
    });
  let flores = recursos ? floresDe(recursos) : [];

  function fallar(error: unknown) {
    console.error(error);
    fallido = true;
    cancelAnimationFrame(raf);
    raf = 0;
    avisar("fallido");
  }

  function cuadro(ahora: number) {
    raf = 0;
    if (!visible || perdido || fallido || enPausa || !recursos) return;
    try {
      ahoraS = ahora / 1000;
      const dt = pasoTiempo(anterior, ahora);
      anterior = ahora;
      const movimiento = op.reducirMovimiento ? 0.15 : 1;
      tiempo += dt * movimiento;
      extra = influenciaScroll(extra, velocidad, dt);
      velocidad *= Math.exp(-dt * 4);

      const dpr = Math.min(window.devicePixelRatio || 1, op.calidad.dprMax);
      const ancho = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const alto = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== ancho || canvas.height !== alto) {
        canvas.width = ancho;
        canvas.height = alto;
      }
      recursos.redimensionar(ancho, alto);

      const camara = op.ajustarCamara ? op.ajustarCamara(p.camara) : p.camara;
      const ojo = { x: 0, y: camara.altura, z: -camara.avance };
      const vp = multiplicar(
        perspectiva(camara.fov, ancho / alto, 0.05, 200),
        mirarA(ojo, { x: 0, y: camara.mirarY, z: camara.mirarZ - camara.avance }),
      );
      const inversa = invertir(vp) ?? vp;
      ultimaVp = vp;

      // el cursor toca el pasto a la altura de las puntas, que es lo que se ve bajo él
      let tocado: { x: number; z: number } | null = null;
      if (puntero) {
        const alturaPuntas = (p.pasto.alturaMin + p.pasto.alturaMax) * 0.4;
        const hit = rayoAPlano(
          inversa,
          (puntero.x / Math.max(1, canvas.clientWidth)) * 2 - 1,
          1 - (puntero.y / Math.max(1, canvas.clientHeight)) * 2,
          alturaPuntas,
        );
        if (hit) {
          tocado = { x: hit.x, z: hit.z };
          bajoCursor = tocado;
        }
      }
      actualizarRastro(rastro, tocado, dt);
      // entra rápido y vuelve despacio, como el pasto real
      const tasaPuntero = tocado ? 1.5 : 1.2;
      fuerzaPuntero += ((tocado ? 1 : 0) - fuerzaPuntero) * (1 - Math.exp(-dt * tasaPuntero));
      const radioQuieto = 0.35 + 0.035 * Math.hypot(bajoCursor.x, bajoCursor.z);

      // la atmósfera del visitante viste los parámetros de este cuadro
      const atmosfera = atmosferaEn(ahoraS);
      const efectos = aplicarAtmosfera(p, atmosfera, ahoraS, recursos.parametros);
      const ola = rafagaDelPrado(ahora);
      const tanMedio = Math.tan((camara.fov * Math.PI) / 360);
      avanzarEnjambre(enjambre, {
        dt: dt * movimiento,
        rafaga: ola.fuerza,
        sentido: sentidoActual(),
        flores,
        puntero: tocado,
        vista: {
          x: ojo.x,
          y: ojo.y,
          z: ojo.z,
          medioAncho: tanMedio * (ancho / alto),
          cerca: maxVoladores.cerca,
          lejos: maxVoladores.lejos,
        },
        mariposas: efectos.mariposas * maxVoladores.mariposas,
        hojas: efectos.hojas * maxVoladores.hojas,
        // primavera: blancas, amarillas y azulitas; verano: damas pintadas y amarillas
        especies:
          atmosfera.estacion.verano > atmosfera.estacion.primavera ? [2, 2, 1, 0] : [0, 0, 1, 3],
      });

      recursos.dibujar({
        vp,
        inversa,
        ojo,
        tiempo,
        rafaga: ola,
        extra,
        puntero: [bajoCursor.x, bajoCursor.z, radioQuieto, fuerzaPuntero],
        rastro: uniformeRastro(rastro),
        deshecho: calcularDeshecho(),
        movimiento,
        ancho,
        alto,
        dpr,
        fov: camara.fov,
        efectos,
        voladores: escribirInstancias(enjambre, datosVoladores),
        datosVoladores,
      });
    } catch (error) {
      fallar(error);
      return;
    }
    raf = requestAnimationFrame(cuadro);
  }

  function calcularDeshecho() {
    for (let i = 0; i < MAX_CABEZAS; i++) {
      const t = sopladas[i];
      const soplo = estadoCabeza(t === undefined || t === null ? null : ahoraS - t);
      // soplada o sin las semillas que se llevó el scroll: manda lo que esté más deshecho
      deshecho[i] = Math.max(soplo, desprendidas[i] ?? 0);
    }
    return deshecho;
  }

  const pedir = () => {
    if (raf || !visible || perdido || fallido || enPausa) return;
    anterior = null;
    raf = requestAnimationFrame(cuadro);
  };

  const observador = new IntersectionObserver(
    (entradas) => {
      visible = visibleSegun(entradas);
      if (visible) pedir();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { rootMargin: "100px" },
  );
  observador.observe(canvas);

  const alPerder = (ev: Event) => {
    ev.preventDefault();
    perdido = true;
    cancelAnimationFrame(raf);
    raf = 0;
    recursos = null;
    avisar("perdido");
  };
  const alRecuperar = () => {
    perdido = false;
    if (!tieneColorFlotante(gl)) {
      fallar(new Error("sin EXT_color_buffer_float tras recuperar el contexto"));
      return;
    }
    try {
      recursos = crearRecursos(gl, op, aspectoActual());
      flores = floresDe(recursos);
    } catch (error) {
      fallar(error);
      return;
    }
    fallido = false;
    avisar("activo");
    pedir();
  };
  canvas.addEventListener("webglcontextlost", alPerder);
  canvas.addEventListener("webglcontextrestored", alRecuperar);

  return {
    fijarScroll(v) {
      velocidad = v;
    },
    fijarEnPausa(pausa) {
      if (pausa === enPausa) return;
      enPausa = pausa;
      if (pausa) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else pedir();
    },
    fijarPuntero(x, y) {
      puntero = Number.isNaN(x) || Number.isNaN(y) ? null : { x, y };
    },
    cabezasEnPantalla() {
      const vp = ultimaVp;
      if (!recursos || !vp) return [];
      const r = canvas.getBoundingClientRect();
      const radioCabeza = op.radioCabeza ?? p.diente.radioCabeza;
      return recursos.dientes.map((d, i) => {
        const punta = puntaDiente(d, i);
        const q = proyectar(vp, punta);
        const borde = proyectar(vp, { ...punta, x: punta.x + radioCabeza });
        return {
          x: r.left + (q.x * 0.5 + 0.5) * r.width,
          y: r.top + (0.5 - q.y * 0.5) * r.height,
          radio: Math.abs(borde.x - q.x) * 0.5 * r.width,
        };
      });
    },
    soplar(indice) {
      const actual = sopladas[indice];
      // una cabeza que se está deshaciendo o pelada no se vuelve a soplar
      if (indice < 0 || indice >= MAX_CABEZAS) return;
      if (actual !== undefined && actual !== null && estadoCabeza(ahoraS - actual) > 0.05) return;
      sopladas[indice] = ahoraS;
    },
    desprender(fracciones) {
      for (let i = 0; i < MAX_CABEZAS; i++) desprendidas[i] = fracciones[i] ?? 0;
    },
    destruir() {
      observador.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener("webglcontextlost", alPerder);
      canvas.removeEventListener("webglcontextrestored", alRecuperar);
      recursos?.destruir();
      recursos = null;
    },
  };
}
