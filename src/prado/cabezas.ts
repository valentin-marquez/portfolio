// Dientes de león que se pueden soplar: al tocarlos se deshacen, quedan pelados un rato y vuelven a
// llenarse despacio. Estado y búsqueda puros; el motor y la página los usan.
import { suave } from "./viento";

const DESHACER = 0.6;
const PELADA = 20;
const RELLENAR = 12;
/** radio mínimo de toque en px: las cabezas chicas también se tienen que poder tocar */
const TOQUE_MINIMO = 18;

/** 0 llena, 1 pelada; `transcurrido` son los segundos desde que se sopló (null si nunca). */
export function estadoCabeza(transcurrido: number | null): number {
  if (transcurrido === null || transcurrido <= 0) return 0;
  if (transcurrido < DESHACER) return suave(0, DESHACER, transcurrido);
  if (transcurrido < DESHACER + PELADA) return 1;
  return 1 - suave(DESHACER + PELADA, DESHACER + PELADA + RELLENAR, transcurrido);
}

/** Índice de la cabeza bajo el punto (la más cercana si hay varias), o -1. */
export function cabezaTocada(
  punto: { x: number; y: number },
  cabezas: ReadonlyArray<{ x: number; y: number; radio: number }>,
): number {
  let mejor = -1;
  let menor = Number.POSITIVE_INFINITY;
  cabezas.forEach((c, i) => {
    const d = Math.hypot(punto.x - c.x, punto.y - c.y);
    if (d <= Math.max(c.radio * 1.1, TOQUE_MINIMO) && d < menor) {
      mejor = i;
      menor = d;
    }
  });
  return mejor;
}
