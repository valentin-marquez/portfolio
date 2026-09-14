/**
 * El reloj propio del sujeto: qué dibujo toca según su tiempo, no según el
 * scroll.
 *
 * Los dibujos NO se funden entre sí, se cortan. La animación 2D no interpola
 * entre poses: cambia de dibujo, y con tres dibujos cualquier transición suave
 * se lee como un efecto —puntos, plastilina— en vez de como movimiento. Lo que
 * mantiene vivo al sujeto entre corte y corte es la flotación del plano
 * (ver `flotacion.ts`), no el dibujo.
 *
 * Los tiempos son desiguales a propósito: el frame 0 se retiene varios segundos
 * y los demás pasan en un parpadeo. A esa velocidad el ojo no registra un
 * cambio de imagen, registra un gesto.
 */

export type RitmoIdle = {
  /** Segundos que se retiene el frame 0, la pose asentada. */
  retencion: number;
  /** Segundos que dura cada frame de gesto. Lo bastante corto para leerse como parpadeo. */
  gesto: number;
};

/** Qué frame toca en este instante. */
export function cuadroIdle(tiempo: number, numFrames: number, ritmo: RitmoIdle): number {
  if (numFrames <= 1) return 0;

  const dura = (i: number) => Math.max(i === 0 ? ritmo.retencion : ritmo.gesto, 0);

  let ciclo = 0;
  for (let i = 0; i < numFrames; i++) ciclo += dura(i);
  if (ciclo <= 0) return 0;

  // el resto de un módulo con operando negativo es negativo en JS, y un tiempo
  // negativo llega en cuanto alguien retrasa el reloj desde el panel
  let t = tiempo % ciclo;
  if (t < 0) t += ciclo;

  for (let i = 0; i < numFrames; i++) {
    if (t < dura(i)) return i;
    t -= dura(i);
  }

  return 0;
}
