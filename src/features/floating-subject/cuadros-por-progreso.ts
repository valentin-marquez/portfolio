/**
 * Progreso local dentro de un tramo (0-1) → qué par de frames mezclar.
 *
 * Cada ancla trae un turnaround de N frames: el primero es la llegada al
 * tramo, el último la pose asentada. El progreso local escala ese rango — en
 * 0 se ve el primer frame puro, en 1 el último frame puro.
 */
export type CuadrosFrames = {
  indiceActual: number;
  indiceSiguiente: number;
  mezcla: number;
};

export function cuadrosPorProgreso(progresoLocal: number, numFrames: number): CuadrosFrames {
  if (numFrames <= 1) return { indiceActual: 0, indiceSiguiente: 0, mezcla: 0 };

  const p = Math.min(Math.max(progresoLocal, 0), 1);
  const escalado = p * (numFrames - 1);
  const indiceActual = Math.min(Math.floor(escalado), numFrames - 2);
  const indiceSiguiente = indiceActual + 1;
  const mezcla = escalado - indiceActual;

  return { indiceActual, indiceSiguiente, mezcla };
}
