/**
 * Qué frames tiene el turnaround de cada ancla, en orden.
 *
 * OJO al sentido: el frame 0 es la pose que se ve asentada durante toda la
 * parada — `indiceDesdeProgreso` trunca hacia abajo, así que la ancla entra
 * en vigor al EMPEZAR su tramo, no al llegar al final. El último frame es
 * un fotograma de tránsito que apenas se ve, justo antes del corte a la
 * siguiente ancla. Quien genere el turnaround en krea.ai debe dibujar la
 * pose asentada como frame 0, no como el último.
 *
 * La posición de la cabeza importa: las anclas 'hombro' y 'cara' encuadran
 * cerca de la cabeza (ver mirarA en encuadres.ts), así que el turnaround
 * debe mantener la cabeza en la misma zona del encuadre en todos sus
 * frames — igual que el relleno actual, que la dibuja a ~26% desde arriba.
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
