/**
 * Los valores que el panel de dirección toca en vivo.
 *
 * Es un objeto MUTABLE a propósito, no estado de React: lo lee `MundoGrafico`
 * en cada fotograma, así que moverlo no tiene por qué pasar por el
 * reconciliador. Lo que sí necesita React —las palabras, porque regenerar la
 * textura es un efecto— vive aparte.
 *
 * En una pieza que es 90% dirección, poder mover esto en caliente es la
 * diferencia entre iterar 200 veces o 20.
 */
export const ajustesDireccion = {
  mundo: {
    angulo: 22,
    densidad: 34,
    bandas: true,
    semitono: true,
    grano: true,
    desregistro: true,
  },
  sujeto: {
    /** Segundos que se retiene la pose asentada. */
    retencion: 3.4,
    /** Segundos que dura cada dibujo de gesto. Corto: se lee como parpadeo. */
    gesto: 0.1,
    /** Amplitud del vaivén vertical, en unidades de mundo. */
    alto: 0.03,
    /** Amplitud de la respiración, como fracción de la escala. */
    respiracion: 0.015,
    /** Amplitud del balanceo, en grados. */
    balanceo: 1.6,
  },
};

export type AjustesDireccion = typeof ajustesDireccion;
