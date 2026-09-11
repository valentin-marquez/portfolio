/**
 * Coreografía de entrada de las formas recortadas.
 *
 * Los números salen de leer persona-im, pero son **punto de partida, no canon**
 * (§3.0 del diseño). Lo que sí conviene conservar es la forma del movimiento, y
 * eso es lo que fijan los tests:
 *
 * - **Escalas de partida asimétricas.** La caja arranca mucho más estrecha que
 *   baja, así que se despliega a lo ancho. Igualarlas la convierte en un
 *   `scale()` corriente.
 * - **Sobrepaso.** Se pasa del destino y vuelve. No es adorno: es lo que separa
 *   "aterriza" de "se posa".
 * - **Pivote anclado.** Las piezas crecen desde su borde, no desde su centro.
 *   Eso vive en la geometría, no aquí (ver `capa-recortes`).
 * - **Todo es corto.** Nada por encima de un tercio de segundo.
 */

export type PiezaCoreografiada = {
  /** Escala horizontal de partida. */
  desdeX: number;
  /** Escala vertical de partida. */
  desdeY: number;
  duracion: number;
  retardo: number;
  /** Fuerza del sobrepaso que se pasa a `back.out()`. */
  sobrepaso: number;
};

export const coreografia = {
  caja: {
    desdeX: 0.3,
    desdeY: 0.8,
    duracion: 180,
    retardo: 90,
    sobrepaso: 1.7,
  } satisfies PiezaCoreografiada,

  barra: {
    // la barra ya es ancha y plana: si arrancara tan estrecha como la caja
    // parecería un hilo, así que parte de más atrás en vertical
    desdeX: 0.42,
    desdeY: 0.65,
    duracion: 200,
    retardo: 0,
    sobrepaso: 1.9,
  } satisfies PiezaCoreografiada,

  /** Separación entre barras consecutivas. Es lo que hace que parezca coreografiado. */
  escalonado: 55,

  /** Cuántas barras tiene la tira de menú. */
  barras: 4,

  /** Tiempo mínimo que se supone entre dos cortes de cámara. */
  corteMinimo: 600,
};

/**
 * Cuánto espera cada barra, con el orden ROTADO según la parada.
 *
 * Sin la rotación, dos cortes seguidos reproducen la misma animación y deja de
 * leerse como una reacción al corte: se convierte en un bucle. Persona-im hace
 * lo equivalente alternando la dirección según la paridad del índice — que no
 * haya dos elementos iguales está programado a propósito.
 */
export function retardoDeBarra(indice: number, parada = 0): number {
  const posicion = (indice + parada) % coreografia.barras;
  return coreografia.barra.retardo + posicion * coreografia.escalonado;
}
