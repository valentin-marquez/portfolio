// La coreografía de los 32 pulsos: qué pasa y cuándo. La forma, el cursor, el contenido y los
// sonidos leen de aquí, así que nada puede desincronizarse.
import {
  altoPaleta,
  CAJAS,
  COLOR,
  centroPaleta,
  coincide,
  type Estado,
  GOMA,
  GRAFICO,
  INTERRUPTOR,
  ISLA,
  PALETA,
  PESTANAS,
  REPRODUCTOR,
  VOLUMEN,
  xDato,
  yCurva,
} from "./disposicion";
import { type Punto, recorrido } from "./recorrido";
import { D, envolver, pulso } from "./tiempo";
import { clamp01, en } from "./util";

/** el contenido nuevo entra un poco después del cambio de forma, cuando el anterior ya salió */
export const RETRASO_ENTRADA = 0.14;

// ── estados de la forma ─────────────────────────────────────────────────────────────

export interface Tramo {
  estado: Estado;
  desde: number;
}

/** el primero es la continuación del último: el botón que quedó del ciclo anterior */
export const TRAMOS: readonly Tramo[] = [
  { estado: "boton", desde: pulso(1) },
  { estado: "cargador", desde: pulso(2) },
  { estado: "check", desde: pulso(4) },
  { estado: "isla", desde: pulso(5) },
  { estado: "reproductor", desde: pulso(6) },
  { estado: "volumen", desde: pulso(11) },
  { estado: "interruptor", desde: pulso(15) },
  { estado: "pestanas", desde: pulso(17) },
  { estado: "grafico", desde: pulso(20) },
  { estado: "paleta", desde: pulso(25) },
  { estado: "toast", desde: pulso(29) },
  { estado: "boton", desde: pulso(31) },
];

/** comienzo del tramo de un estado dentro del ciclo (para el botón, el del pulso 31) */
export function inicioDe(estado: Estado): number {
  return TRAMOS.slice(1).find((tr) => tr.estado === estado)?.desde ?? 0;
}

export interface Ventana {
  entra: number;
  sale: number;
}

/** ventanas [entra, sale] del contenido de un estado; la del botón final cruza el loop */
export function ventanasDe(estado: Estado): Ventana[] {
  const ventanas: Ventana[] = [];
  for (let i = 1; i < TRAMOS.length; i++) {
    const tramo = en(TRAMOS, i);
    if (tramo.estado !== estado) continue;
    const siguiente = TRAMOS[i + 1]?.desde ?? D + en(TRAMOS, 1).desde;
    ventanas.push({ entra: tramo.desde + RETRASO_ENTRADA, sale: siguiente });
  }
  return ventanas;
}

/** cambios de color de la caja que no son cambios de estado */
export const COLORES_EXTRA = [{ t: pulso(16), color: COLOR.verde }] as const;

/** desde el pulso 3 el arco del cargador se va cerrando */
export const CARGADOR_CIERRA = pulso(3);

// ── clics ───────────────────────────────────────────────────────────────────────────

export type Sonido = "clic" | "interruptor" | "agarre" | "tecla" | "enter" | "exito" | "pop";
export type Hundido = "forma" | "play" | "pestana";

export interface Clic {
  t: number;
  x: number;
  y: number;
  hunde: Hundido;
  sonido: Sonido;
}

export const CLICS: readonly Clic[] = [
  { t: pulso(1), x: 18, y: 4, hunde: "forma", sonido: "clic" },
  { t: pulso(6), x: 40, y: 2, hunde: "forma", sonido: "clic" },
  { t: pulso(7), x: 0, y: REPRODUCTOR.controles.y, hunde: "play", sonido: "clic" },
  { t: pulso(8), x: 0, y: REPRODUCTOR.controles.y, hunde: "play", sonido: "clic" },
  { t: pulso(16), x: 6, y: 2, hunde: "forma", sonido: "interruptor" },
  { t: pulso(18), x: PESTANAS.xs[1] + 2, y: 3, hunde: "pestana", sonido: "clic" },
  { t: pulso(19), x: PESTANAS.xs[2] + 2, y: 3, hunde: "pestana", sonido: "clic" },
];

/** se presiona un poco antes del pulso y se suelta después: el sonido cae en el pulso */
export const PRESION = { antes: 0.04, despues: 0.09 } as const;
export const presionar = (t: number) => envolver(t - PRESION.antes);
export const soltar = (t: number) => envolver(t + PRESION.despues);

// ── reproductor ─────────────────────────────────────────────────────────────────────

export const PAUSA = { desde: pulso(7), hasta: pulso(8) } as const;
/** 1 = sonando (se ve el ícono de pausa), 0 = en pausa (se ve el de play) */
export const REPRODUCIENDO = [
  { t: PAUSA.desde, a: 0 },
  { t: PAUSA.hasta, a: 1 },
] as const;
export const PROGRESO = { t0: pulso(9), t1: pulso(10) } as const;

const barra = REPRODUCTOR.barra;
export const xDeProgreso = (p: number) => barra.x0 + p * (barra.x1 - barra.x0);
export const progresoDeX = (x: number) => clamp01((x - barra.x0) / (barra.x1 - barra.x0));

/** la canción avanza con la pieza (es el mismo audio) y se congela durante la pausa */
function cancionSinArrastre(t: number): number {
  const pausado = Math.min(Math.max(t - PAUSA.desde, 0), PAUSA.hasta - PAUSA.desde);
  return REPRODUCTOR.inicio + t - pausado;
}

const xAgarre = xDeProgreso(cancionSinArrastre(PROGRESO.t0) / REPRODUCTOR.duracion);
export const PUNTOS_PROGRESO: readonly Punto[] = [
  [PROGRESO.t0, xAgarre],
  [pulso(9.4), xAgarre + 30],
  [pulso(9.75), 62],
  [PROGRESO.t1, 70],
];
export const xArrastreProgreso = recorrido(PUNTOS_PROGRESO);

/** segundos de la canción que muestra el reproductor */
export function tiempoCancion(t: number): number {
  if (t < PROGRESO.t0) return cancionSinArrastre(t);
  if (t <= PROGRESO.t1) return progresoDeX(xArrastreProgreso(t)) * REPRODUCTOR.duracion;
  return progresoDeX(xArrastreProgreso(PROGRESO.t1)) * REPRODUCTOR.duracion + (t - PROGRESO.t1);
}

// ── volumen ─────────────────────────────────────────────────────────────────────────

export const ARRASTRE_VOLUMEN = { t0: pulso(11.6), t1: pulso(14) } as const;
const vol = VOLUMEN.barra;
export const xDeVolumen = (v: number) => vol.x0 + v * (vol.x1 - vol.x0);
export const PUNTOS_VOLUMEN: readonly Punto[] = [
  [ARRASTRE_VOLUMEN.t0, xDeVolumen(VOLUMEN.inicial)],
  [pulso(12), xDeVolumen(0.7)],
  [pulso(13), vol.x1 + 14],
  [pulso(13.6), vol.x1 + 70],
  [ARRASTRE_VOLUMEN.t1, vol.x1 + 64],
];
export const xArrastreVolumen = recorrido(PUNTOS_VOLUMEN);

/** px de sobre-arrastre → px de estiramiento: resistencia logarítmica, como la goma de iOS */
export const goma = (x: number) => GOMA.k * Math.log1p(Math.max(0, x) / GOMA.k);
export const estiramientoVolumen = (t: number) => goma(xArrastreVolumen(t) - vol.x1);
export const valorVolumen = (t: number) =>
  clamp01((xArrastreVolumen(t) - vol.x0) / (vol.x1 - vol.x0));

// ── gráfico ─────────────────────────────────────────────────────────────────────────

export const LINEA_DIBUJA = pulso(21);
export const HOVER = { t0: pulso(22), t1: pulso(24.3) } as const;
export const PUNTOS_HOVER: readonly Punto[] = [
  [HOVER.t0, xDato(6)],
  [pulso(23), xDato(14)],
  [pulso(24), xDato(21)],
  [HOVER.t1, xDato(21)],
];
export const xHover = recorrido(PUNTOS_HOVER);
/** el cursor recorre la curva un poco por debajo, para no tapar el punto */
export const yHover = (t: number) => yCurva(xHover(t)) + 12;

// ── paleta ⌘K ───────────────────────────────────────────────────────────────────────

export const PALETA_T = {
  abre: pulso(25),
  enter: pulso(28),
  cierra: pulso(29),
  /** con la paleta ya oculta, todo vuelve a su estado inicial para el próximo ciclo */
  reinicia: pulso(30),
} as const;

/** «cuadro» letra a letra, en semicorcheas, al ritmo del güiro */
export const TECLAS: readonly number[] = [26, 26.25, 26.5, 27, 27.25, 27.5].map(pulso);

export function letrasEn(t: number): number {
  let n = 0;
  for (const k of TECLAS) if (k <= t) n++;
  return n;
}

export interface Filtro {
  t: number;
  visibles: boolean[];
}

/** los momentos en que cambia qué filas coinciden con lo escrito */
export function filtros(): Filtro[] {
  const lista: Filtro[] = [];
  let previo = PALETA.items.map(() => true);
  TECLAS.forEach((t, i) => {
    const consulta = PALETA.consulta.slice(0, i + 1);
    const visibles = PALETA.items.map((item) => coincide(item.texto, consulta));
    if (visibles.some((v, j) => v !== en(previo, j))) lista.push({ t, visibles });
    previo = visibles;
  });
  return lista;
}

const contar = (v: readonly boolean[]) => v.filter(Boolean).length;

/** alto de la caja mientras la paleta se filtra */
export const ALTOS_PALETA = filtros().map((f) => ({ t: f.t, h: altoPaleta(contar(f.visibles)) }));

/** centro vertical de la caja (y de la cámara): la paleta se encoge hacia arriba */
export const CENTROS_Y = [
  ...filtros().map((f) => ({ t: f.t, y: centroPaleta(contar(f.visibles)) })),
  { t: PALETA_T.cierra, y: 0 },
];

// ── la pieza líquida: knob → indicador de pestaña → resalte de la paleta ─────────────

export interface Pose {
  t: number;
  L: number;
  R: number;
  cy: number;
  alto: number;
  color: string;
}

const centrada = (x: number, ancho: number) => ({ L: x - ancho / 2, R: x + ancho / 2 });
const knobEn = (x: number) => ({
  ...centrada(x, INTERRUPTOR.knob),
  cy: 0,
  alto: INTERRUPTOR.knob,
  color: COLOR.blanco,
});
const pestanaEn = (x: number) => ({
  ...centrada(x, PESTANAS.ancho),
  cy: 0,
  alto: PESTANAS.alto,
  color: COLOR.negro,
});
const filaPaleta = {
  ...centrada(0, CAJAS.paleta.w - 2 * PALETA.filas.margen),
  cy: PALETA.filas.y0,
  alto: PALETA.filas.alto,
};

export const POSES: readonly Pose[] = [
  // invisible todavía: se ubica donde va a aparecer el knob
  { t: pulso(14.5), ...knobEn(INTERRUPTOR.xApagado) },
  { t: pulso(16), ...knobEn(INTERRUPTOR.xEncendido) },
  { t: pulso(17), ...pestanaEn(PESTANAS.xs[0]) },
  { t: pulso(18), ...pestanaEn(PESTANAS.xs[1]) },
  { t: pulso(19), ...pestanaEn(PESTANAS.xs[2]) },
  {
    t: pulso(20),
    ...centrada(GRAFICO.pestanas.xs[2], GRAFICO.pestanas.ancho),
    cy: GRAFICO.pestanas.y,
    alto: GRAFICO.pestanas.alto,
    color: COLOR.negro,
  },
  { t: PALETA_T.abre, ...filaPaleta, color: COLOR.resalte },
  { t: PALETA_T.enter, ...filaPaleta, color: COLOR.negro },
  {
    t: PALETA_T.cierra,
    ...centrada(0, CAJAS.toast.w),
    cy: 0,
    alto: CAJAS.toast.h,
    color: COLOR.negro,
  },
];

export const OPACIDAD_PIEZA = [
  { t: pulso(15) + RETRASO_ENTRADA, a: 1 },
  { t: pulso(29.6), a: 0 },
] as const;

// ── la carátula: crece de la isla a la tarjeta ──────────────────────────────────────

export interface PoseArte {
  t: number;
  x: number;
  y: number;
  lado: number;
  radio: number;
}

export const POSES_ARTE: readonly PoseArte[] = [
  { t: pulso(4.5), ...ISLA.arte },
  { t: pulso(6), ...REPRODUCTOR.arte },
];

export const OPACIDAD_ARTE = [
  { t: pulso(5) + RETRASO_ENTRADA, a: 1 },
  { t: pulso(11), a: 0 },
] as const;

// ── cursor ──────────────────────────────────────────────────────────────────────────

export interface Movimiento {
  t: number;
  x: number;
  y: number;
}

/** hacia dónde va el cursor entre clics; los arrastres y el hover son manipulación directa.
 *  Cada movimiento sale con al menos 0,7 pulsos de ventaja para llegar asentado al clic */
export const MOVIMIENTOS: readonly Movimiento[] = [
  { t: pulso(1.35), x: 64, y: 58 },
  { t: pulso(5.2), x: 40, y: 2 },
  { t: pulso(6.2), x: 0, y: REPRODUCTOR.controles.y },
  { t: pulso(8.15), x: xAgarre, y: REPRODUCTOR.barra.y },
  { t: pulso(10.35), x: xDeVolumen(VOLUMEN.inicial), y: 0 },
  { t: pulso(14.3), x: 6, y: 2 },
  { t: pulso(17.2), x: PESTANAS.xs[1] + 2, y: 3 },
  { t: pulso(18.3), x: PESTANAS.xs[2] + 2, y: 3 },
  { t: pulso(20.6), x: xDato(6), y: yHover(HOVER.t0) },
  { t: pulso(24.35), x: 196, y: 30 },
  { t: pulso(30), x: 150, y: 70 },
  { t: pulso(32), x: 18, y: 4 },
];

// ── sonidos ─────────────────────────────────────────────────────────────────────────

export interface EventoSonido {
  t: number;
  sonido: Sonido;
}

export function sonidos(): EventoSonido[] {
  const lista: EventoSonido[] = [
    ...CLICS.map((c) => ({ t: c.t, sonido: c.sonido })),
    { t: PROGRESO.t0, sonido: "agarre" },
    { t: ARRASTRE_VOLUMEN.t0, sonido: "agarre" },
    { t: pulso(4), sonido: "exito" },
    ...TECLAS.map((t) => ({ t, sonido: "tecla" as const })),
    { t: PALETA_T.enter, sonido: "enter" },
    { t: PALETA_T.cierra, sonido: "pop" },
  ];
  return lista.sort((a, b) => a.t - b.t);
}

/** todos los instantes en que la coreografía hace algo; el test exige uno en cada pulso */
export function momentos(): number[] {
  return [
    ...TRAMOS.map((tr) => tr.desde),
    ...CLICS.map((c) => c.t),
    ...MOVIMIENTOS.map((m) => m.t),
    ...TECLAS,
    ...[PUNTOS_PROGRESO, PUNTOS_VOLUMEN, PUNTOS_HOVER].flatMap((ps) => ps.map((p) => p[0])),
    ...POSES.map((p) => p.t),
    CARGADOR_CIERRA,
    LINEA_DIBUJA,
    PALETA_T.enter,
  ].sort((a, b) => a - b);
}
