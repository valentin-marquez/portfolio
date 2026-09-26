// La rejilla del experimento: 32 pulsos de cumbia. La duración sale de las muestras del audio
// (rejilla.json), así el loop de la animación y el del sonido miden exactamente lo mismo.
import rejilla from "./rejilla.json";

export const PULSOS = 32;
export const D = rejilla.muestras / rejilla.frecuencia;
export const P = D / PULSOS;
/** lado del cuadrado de diseño; la vista lo escala al lado corto del contenedor */
export const LADO = 1440;

/** segundos del pulso n (1 es el primero; admite fracciones: 3.5 es la corchea después del 3) */
export function pulso(n: number): number {
  return (n - 1) * P;
}

/** lleva cualquier tiempo a [0, D) */
export function envolver(t: number): number {
  return ((t % D) + D) % D;
}

/** el cuadro que se muestra quieto (tarjeta sin hover, menos movimiento); se elige mirando en la Tarea 13 */
export const CUADRO_FIJO = pulso(6.6);
