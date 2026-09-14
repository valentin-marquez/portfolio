/**
 * Qué frames tiene el turnaround de cada ancla, en orden.
 *
 * El primero es la llegada al tramo, el último la pose asentada al llegar a
 * la parada — `cuadrosPorProgreso` mezcla entre ellos según el progreso local.
 *
 * De relleno mientras no exista el arte final de krea.ai (ver diseño del
 * 14-09, §1): sustituir los PNG en public/sujeto/ no requiere tocar este
 * fichero salvo que cambie el número de frames por ancla.
 */
export const framesPorAncla: Record<string, readonly string[]> = {
  lejos: ["/sujeto/lejos-0.png", "/sujeto/lejos-1.png", "/sujeto/lejos-2.png"],
  cuerpo: ["/sujeto/cuerpo-0.png", "/sujeto/cuerpo-1.png", "/sujeto/cuerpo-2.png"],
  hombro: ["/sujeto/hombro-0.png", "/sujeto/hombro-1.png", "/sujeto/hombro-2.png"],
  cara: ["/sujeto/cara-0.png", "/sujeto/cara-1.png", "/sujeto/cara-2.png"],
};
