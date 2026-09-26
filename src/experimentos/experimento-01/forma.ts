// La forma en t: la caja, la pieza líquida y la carátula, cada propiedad en su propia pista.
import { pistaColor, type Rgb } from "./color";
import { CAJAS, type Estado } from "./disposicion";
import {
  ALTOS_PALETA,
  ARRASTRE_VOLUMEN,
  CENTROS_Y,
  CLICS,
  COLORES_EXTRA,
  estiramientoVolumen,
  OPACIDAD_ARTE,
  OPACIDAD_PIEZA,
  POSES,
  POSES_ARTE,
  presionar,
  soltar,
  TRAMOS,
} from "./guion";
import { type Cambio, pistaCiclica, R, type Resorte } from "./resortes";
import { clamp01 } from "./util";

export interface Pieza {
  L: number;
  R: number;
  cy: number;
  alto: number;
  color: Rgb;
  opacidad: number;
  cuello: number;
}

export interface Arte {
  x: number;
  y: number;
  lado: number;
  radio: number;
  opacidad: number;
}

export interface Forma {
  cx: number;
  cy: number;
  w: number;
  h: number;
  r: number;
  color: Rgb;
  estiramiento: number;
  hundido: number;
  pieza: Pieza;
  arte: Arte;
}

/** cuánto se achica la caja al presionarla */
const HUNDIDO = 0.04;
/** cuello líquido: cuánto se afina la pieza por unidad de estiramiento, y su tope */
const CUELLO = { factor: 0.6, tope: 0.3 };

const porEstado = (valor: (e: Estado) => number, r: Resorte): Cambio[] =>
  TRAMOS.slice(1).map((tr) => ({ t: tr.desde, a: valor(tr.estado), r }));

const ancho = pistaCiclica(porEstado((e) => CAJAS[e].w, R.firme));
const alto = pistaCiclica([
  ...porEstado((e) => CAJAS[e].h, R.firme),
  ...ALTOS_PALETA.map((a) => ({ t: a.t, a: a.h, r: R.firme })),
]);
const radio = pistaCiclica(porEstado((e) => CAJAS[e].r, R.firme));
const centroY = pistaCiclica(CENTROS_Y.map((c) => ({ t: c.t, a: c.y, r: R.firme })));
const color = pistaColor([
  ...TRAMOS.slice(1).map((tr) => ({ t: tr.desde, color: CAJAS[tr.estado].color, r: R.firme })),
  ...COLORES_EXTRA.map((c) => ({ t: c.t, color: c.color, r: R.firme })),
]);
const hundido = pistaCiclica(
  CLICS.filter((c) => c.hunde === "forma").flatMap((c) => [
    { t: presionar(c.t), a: 1, r: R.salida },
    { t: soltar(c.t), a: 0, r: R.firme },
  ]),
);
const estiramiento = pistaCiclica([
  { ...ARRASTRE_VOLUMEN, valor: estiramientoVolumen, a: 0, r: R.firme },
]);

function pistasPieza() {
  const L: Cambio[] = [];
  const Rb: Cambio[] = [];
  let previa = POSES.at(-1);
  for (const p of POSES) {
    const centro = (p.L + p.R) / 2;
    const antes = previa ? (previa.L + previa.R) / 2 : centro;
    // el borde que va adelante usa el resorte rápido y el de atrás el suave: la pieza se estira
    const haciaDerecha = centro >= antes;
    L.push({ t: p.t, a: p.L, r: haciaDerecha ? R.suave : R.rapido });
    Rb.push({ t: p.t, a: p.R, r: haciaDerecha ? R.rapido : R.suave });
    previa = p;
  }
  return {
    L: pistaCiclica(L),
    R: pistaCiclica(Rb),
    cy: pistaCiclica(POSES.map((p) => ({ t: p.t, a: p.cy, r: R.firme }))),
    alto: pistaCiclica(POSES.map((p) => ({ t: p.t, a: p.alto, r: R.firme }))),
    reposo: pistaCiclica(POSES.map((p) => ({ t: p.t, a: p.R - p.L, r: R.firme }))),
    color: pistaColor(POSES.map((p) => ({ t: p.t, color: p.color, r: R.firme }))),
    opacidad: pistaCiclica(
      OPACIDAD_PIEZA.map((o) => ({ t: o.t, a: o.a, r: o.a > 0 ? R.rapido : R.salida })),
    ),
  };
}
const pieza = pistasPieza();

const arte = {
  x: pistaCiclica(POSES_ARTE.map((p) => ({ t: p.t, a: p.x, r: R.firme }))),
  y: pistaCiclica(POSES_ARTE.map((p) => ({ t: p.t, a: p.y, r: R.firme }))),
  lado: pistaCiclica(POSES_ARTE.map((p) => ({ t: p.t, a: p.lado, r: R.firme }))),
  radio: pistaCiclica(POSES_ARTE.map((p) => ({ t: p.t, a: p.radio, r: R.firme }))),
  opacidad: pistaCiclica(
    OPACIDAD_ARTE.map((o) => ({ t: o.t, a: o.a, r: o.a > 0 ? R.suave : R.salida })),
  ),
};

export function formaEn(t: number): Forma {
  const w = ancho(t);
  const e = estiramiento(t);
  const hun = hundido(t);
  const escala = 1 - HUNDIDO * hun;
  const L = pieza.L(t);
  const Rb = pieza.R(t);
  const estira = (Rb - L) / Math.max(pieza.reposo(t), 1e-3);
  return {
    // la goma alarga el lado arrastrado: el borde izquierdo queda quieto
    cx: e / 2,
    cy: centroY(t),
    w: (w + e) * escala,
    // y afina un poco el alto, como si conservara volumen
    h: alto(t) * Math.sqrt(w / (w + e)) * escala,
    r: radio(t) * escala,
    color: color(t),
    estiramiento: e,
    hundido: hun,
    pieza: {
      L,
      R: Rb,
      cy: pieza.cy(t),
      alto: pieza.alto(t),
      color: pieza.color(t),
      opacidad: clamp01(pieza.opacidad(t)),
      cuello: Math.min(CUELLO.tope, Math.max(0, (estira - 1) * CUELLO.factor)),
    },
    arte: {
      x: arte.x(t),
      y: arte.y(t),
      lado: arte.lado(t),
      radio: arte.radio(t),
      opacidad: clamp01(arte.opacidad(t)),
    },
  };
}
