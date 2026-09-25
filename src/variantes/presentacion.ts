// Presentación que avanza en su lugar: la página no baja. En la portada está el prado; al avanzar,
// la cámara entra en él mientras se disuelve en bruma y, donde desaparece el prado, emerge el
// contenido, paso a paso. Al final la cámara retrocede a su lugar y el prado vuelve para el cierre.
// s es la posición continua en la presentación: 0 en la portada, PASOS.length − 1 en el cierre.
import type { Parametros } from "@/prado/parametros";
import { suave } from "@/prado/viento";

export const PASOS = [
  "portada",
  "intro",
  "experimento-01",
  "experimento-02",
  "experimento-03",
  "experimento-04",
  "sobre-mi",
  "cierre",
] as const;

const ULTIMO = PASOS.length - 1;
/** cuánto camina la cámara hacia adentro del prado al dejar la portada (m) */
const AVANCE = 9;
const DESENFOQUE_ENTRADA = 14;
const DESENFOQUE_SALIDA = 10;

export interface EstadoPanel {
  opacidad: number;
  /** px de desenfoque: lo que llega emerge de la bruma, lo que se va pasa desenfocado */
  desenfoque: number;
  escala: number;
}

function panel(s: number, j: number): EstadoPanel {
  const d = s - j;
  if (d >= 0) {
    // se va: pasa a tu lado, creciendo apenas y desenfocándose
    const t = suave(0.05, 0.5, d);
    return { opacidad: 1 - t, desenfoque: DESENFOQUE_SALIDA * t, escala: 1 + 0.06 * t };
  }
  // llega: emerge de la bruma, desde un poco más chico
  const t = suave(0.45, 0.95, d + 1);
  return { opacidad: t, desenfoque: DESENFOQUE_ENTRADA * (1 - t), escala: 0.94 + 0.06 * t };
}

const limitar = (s: number) => Math.min(ULTIMO, Math.max(0, s));

export function estadoPresentacion(posicion: number) {
  const s = limitar(posicion);
  const saleDeLaPortada = 1 - suave(0.3, 0.85, s);
  const vuelveEnElCierre = suave(ULTIMO - 0.65, ULTIMO - 0.05, s);
  return {
    paneles: PASOS.map((_, j) => panel(s, j)),
    prado: { opacidad: Math.max(saleDeLaPortada, vuelveEnElCierre) },
  };
}

/** La cámara entra en el prado al dejar la portada y, en el cierre, retrocede hasta su lugar. */
export function camaraPresentacion(
  base: Parametros["camara"],
  posicion: number,
): Parametros["camara"] {
  const s = limitar(posicion);
  let t = 0;
  if (s < 1) t = suave(0, 1, s);
  else if (s > ULTIMO - 1) t = 1 - suave(ULTIMO - 1, ULTIMO, s);
  else t = 1;
  if (t === 0) return base;
  return { ...base, avance: base.avance + AVANCE * t, altura: base.altura - 0.5 * t };
}
