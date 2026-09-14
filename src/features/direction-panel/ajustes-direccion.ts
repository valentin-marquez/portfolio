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
    /** Cómo pasa de un frame al siguiente: 0 corte, 1 trama, 2 flujo. */
    modo: 1,
    /** Segundos que se retiene la pose asentada. */
    retencion: 3,
    /** Segundos que se retiene cada frame de gesto. */
    gesto: 0.3,
    /** Segundos que dura el paso de un frame al siguiente. */
    transicion: 0.22,
    escalaFlujo: 0.08,
    densidadTrama: 34,
  },
};

export type AjustesDireccion = typeof ajustesDireccion;
