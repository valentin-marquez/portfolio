/**
 * Los valores que el panel de dirección toca en vivo.
 *
 * Es un objeto MUTABLE a propósito, no estado de React: lo leen los `useFrame`
 * en cada fotograma, así que moverlo no tiene por qué pasar por el reconciliador.
 * Lo que sí necesita React —las palabras, porque regenerar la textura es un
 * efecto— vive aparte.
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
  cel: {
    usarTextura: true,
    corteLuz: 0.32,
    corteSombra: -0.08,
    medio: 0.66,
    sombra: 0.38,
    grosorContorno: 0.011,
  },
  sujeto: {
    /** Vueltas por segundo en radianes: el reloj propio del objeto. */
    giro: 0.16,
    /** Amplitud del balanceo secundario, en radianes. */
    deriva: 0.062,
  },
};

export type AjustesDireccion = typeof ajustesDireccion;
