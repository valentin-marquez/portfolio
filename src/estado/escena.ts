// Estado compartido fuera de React: lo leen los motores y la capa de semillas en cada cuadro, así el
// scroll no provoca renders.
import type { Prado } from "@/prado/motor";
import { crearParametros } from "@/prado/parametros";
import type { Punto } from "@/prado/semillas";
import { intensidad } from "@/prado/viento";

export const COLUMNA = 560;

export const escena = {
  progreso: 0,
  /** px/s, con signo */
  velocidad: 0,
  /** intensidad del viento 0..1, la misma que oye el audio */
  viento: 0,
  /** parámetros del prado, compartidos y mutables (panel de depuración) */
  parametros: crearParametros(),
  pradoHero: null as Prado | null,
  pradoCierre: null as Prado | null,
  elHero: null as HTMLElement | null,
  elCierre: null as HTMLElement | null,
};

/**
 * Intensidad del viento para el latido (audio y semillas). Usa la misma línea de tiempo que
 * rafagaDelPrado: un solo viento para el pasto, las flores, las semillas y el sonido.
 */
export function vientoDelLatido(ahoraMs: number, influencia: number): number {
  return intensidad(ahoraMs / 1000, 0, influencia);
}

export function calcularProgreso(
  scrollY: number,
  altoDocumento: number,
  altoVentana: number,
): number {
  const recorrido = altoDocumento - altoVentana;
  if (recorrido <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / recorrido));
}

type Rect = { left: number; top: number; width: number; height: number };

/** Dónde aterrizan las semillas: repartidas en la franja baja del prado del cierre. */
export function destinosAterrizaje(rect: Rect, n: number): Punto[] {
  return Array.from({ length: n }, (_, i) => {
    const f = (i + 0.5) / n;
    return {
      x: rect.left + rect.width * (0.18 + 0.64 * f),
      y: rect.top + rect.height * (0.66 + 0.12 * Math.sin(i * 2.3)),
    };
  });
}
