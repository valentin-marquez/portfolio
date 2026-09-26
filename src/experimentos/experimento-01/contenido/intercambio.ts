// Cómo entra y sale el contenido de cada estado: opacidad, un desenfoque corto y una escala leve,
// con resortes. La salida es más rápida que la entrada y termina antes de que la siguiente empiece.
import type { Ventana } from "../guion";
import { paso, R } from "../resortes";
import { D } from "../tiempo";
import { clamp01 } from "../util";

export function visibilidad(t: number, ventanas: readonly Ventana[]): number {
  let v = 0;
  for (const w of ventanas) {
    // t + D es el mismo instante visto desde el ciclo anterior (para la ventana que cruza el loop)
    for (const x of [t, t + D]) v += paso(x - w.entra, R.firme) * (1 - paso(x - w.sale, R.salida));
  }
  return clamp01(v);
}

export interface Aspecto {
  opacidad: number;
  desenfoque: number;
  escala: number;
}

/** el desenfoque se piensa en px del cuadro de 1440 (10 como máximo) y se pasa a px de diseño */
export function aspecto(v: number, zoom: number): Aspecto {
  return { opacidad: v, desenfoque: ((1 - v) * 10) / zoom, escala: 0.96 + 0.04 * v };
}
