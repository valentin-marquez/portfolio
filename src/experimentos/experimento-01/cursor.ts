// El cursor en px de diseño: resortes hacia cada objetivo (x más rígido que y, así los trayectos se
// curvan como los de una mano) y manipulación directa en los arrastres y el hover.
import {
  ARRASTRE_VOLUMEN,
  CLICS,
  HOVER,
  MOVIMIENTOS,
  PROGRESO,
  presionar,
  soltar,
  xArrastreProgreso,
  xArrastreVolumen,
  xHover,
  yHover,
} from "./guion";
import { type EventoPista, pistaCiclica, R } from "./resortes";
import { clamp01 } from "./util";

export interface Cursor {
  x: number;
  y: number;
  presion: number;
}

const directo = (t0: number, t1: number, valor: (t: number) => number): EventoPista => ({
  t0,
  t1,
  valor,
  a: valor(t1),
  r: R.firme,
});

const x = pistaCiclica([
  ...MOVIMIENTOS.map((m) => ({ t: m.t, a: m.x, r: R.firme })),
  directo(PROGRESO.t0, PROGRESO.t1, xArrastreProgreso),
  directo(ARRASTRE_VOLUMEN.t0, ARRASTRE_VOLUMEN.t1, xArrastreVolumen),
  directo(HOVER.t0, HOVER.t1, xHover),
]);
const y = pistaCiclica([
  ...MOVIMIENTOS.map((m) => ({ t: m.t, a: m.y, r: R.suave })),
  directo(HOVER.t0, HOVER.t1, yHover),
]);
const presion = pistaCiclica([
  ...CLICS.flatMap((c) => [
    { t: presionar(c.t), a: 1, r: R.salida },
    { t: soltar(c.t), a: 0, r: R.firme },
  ]),
  ...[PROGRESO, ARRASTRE_VOLUMEN].flatMap((a) => [
    { t: presionar(a.t0), a: 1, r: R.salida },
    { t: a.t1, a: 0, r: R.firme },
  ]),
]);

export function cursorEn(t: number): Cursor {
  return { x: x(t), y: y(t), presion: clamp01(presion(t)) };
}
