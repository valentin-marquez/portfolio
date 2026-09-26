// Cálculos puros del contenido: formatos y cuánto tapa la pieza a una etiqueta.
import { clamp01 } from "../util";

/** 82.4 → "1:22"; los negativos llevan signo: -77.2 → "-1:17" */
export function formatoTiempo(s: number): string {
  const signo = s < 0 ? "-" : "";
  const total = Math.floor(Math.abs(s));
  return `${signo}${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** 84320 → "84.320" */
export function formatoMiles(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** qué fracción de [x − medio, x + medio] queda bajo la pieza [L, R] */
export function cubrimiento(L: number, R: number, x: number, medio: number): number {
  return clamp01((Math.min(R, x + medio) - Math.max(L, x - medio)) / (2 * medio));
}
