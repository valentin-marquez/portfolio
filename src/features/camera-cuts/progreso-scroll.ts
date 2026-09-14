/**
 * Scroll crudo → progreso → índice de encuadre.
 *
 * Aquí NO se amortigua nada (§4.4 del diseño). El scroll entra tal cual y es la
 * cámara la que lleva muelle; amortiguar los dos encadena dos inercias y se
 * siente blando.
 */

function recortar(v: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(v, minimo), maximo);
}

/** Desplazamiento y recorrido en píxeles → progreso en [0, 1]. */
export function progresoDesdeScroll(desplazamiento: number, recorrido: number): number {
  // en el primer fotograma la página todavía no tiene altura: sin esto sale NaN
  if (recorrido <= 0) return 0;
  return recortar(desplazamiento / recorrido, 0, 1);
}

/**
 * Progreso → qué encuadre toca.
 *
 * Cada parada ocupa una franja igual del recorrido, así que el scroll reparte el
 * mismo esfuerzo entre todas.
 */
export function indiceDesdeProgreso(progreso: number, paradas: number): number {
  if (paradas <= 1) return 0;
  const p = recortar(progreso, 0, 1);
  return Math.min(Math.floor(p * paradas), paradas - 1);
}
