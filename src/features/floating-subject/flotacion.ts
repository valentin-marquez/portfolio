/**
 * La vida continua del sujeto: flota, respira y se balancea.
 *
 * Es lo que hace que el plano no parezca una pegatina sin tener que cambiar de
 * dibujo. Los dibujos entran solo como golpes puntuales (ver `ciclo-idle.ts`);
 * el movimiento de fondo lo pone esto.
 *
 * Todo OSCILA, no se integra. Sumar un incremento por fotograma acumula sin
 * límite y el sujeto acaba a la deriva; lo que se busca son unos pocos grados
 * y unos pocos centímetros. Las tres frecuencias son inconmensurables entre sí
 * para que el conjunto no repita nunca el mismo instante.
 */

export type AjusteFlotacion = {
  /** Amplitud del vaivén vertical, en unidades de mundo. */
  alto: number;
  /** Amplitud de la respiración, como fracción de la escala. */
  respiracion: number;
  /** Amplitud del balanceo, en grados. */
  balanceo: number;
};

export type Flotacion = {
  alto: number;
  escala: number;
  /** En grados. */
  giro: number;
};

export function flotacionEn(tiempo: number, ajuste: AjusteFlotacion): Flotacion {
  return {
    alto: Math.sin(tiempo * 0.63) * ajuste.alto,
    escala: 1 + Math.sin(tiempo * 1.15 + 1.7) * ajuste.respiracion,
    giro: Math.sin(tiempo * 0.29 + 0.6) * ajuste.balanceo,
  };
}
