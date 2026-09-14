/**
 * El reloj propio del sujeto: qué frame toca según su tiempo, no según el scroll.
 *
 * Los tiempos son desiguales a propósito. Con todos los frames durando lo mismo
 * el bucle suena a metrónomo; reteniendo la pose asentada varios segundos y
 * dejando pasar los demás en un suspiro, lee como un gesto puntual —
 * una respiración— y no como una animación en marcha.
 */

export type CuadroIdle = {
  indiceActual: number;
  indiceSiguiente: number;
  /** 0 mientras el frame está quieto; sube a 1 durante el paso al siguiente. */
  transicion: number;
};

export type RitmoIdle = {
  /** Segundos que se retiene el frame 0, la pose asentada. */
  retencion: number;
  /** Segundos que se retiene cada frame de gesto. */
  gesto: number;
  /** Segundos que dura el paso de un frame al siguiente. En 0, corte seco. */
  transicion: number;
};

export function cuadroIdle(tiempo: number, numFrames: number, ritmo: RitmoIdle): CuadroIdle {
  if (numFrames <= 1) return { indiceActual: 0, indiceSiguiente: 0, transicion: 0 };

  const quieto = (i: number) => Math.max(i === 0 ? ritmo.retencion : ritmo.gesto, 0);
  const paso = Math.max(ritmo.transicion, 0);

  let ciclo = 0;
  for (let i = 0; i < numFrames; i++) ciclo += quieto(i) + paso;
  if (ciclo <= 0) return { indiceActual: 0, indiceSiguiente: 1, transicion: 0 };

  // el resto de un módulo con operando negativo es negativo en JS, y un tiempo
  // negativo llega en cuanto alguien retrasa el reloj desde el panel
  let t = tiempo % ciclo;
  if (t < 0) t += ciclo;

  for (let i = 0; i < numFrames; i++) {
    const siguiente = (i + 1) % numFrames;

    if (t < quieto(i)) return { indiceActual: i, indiceSiguiente: siguiente, transicion: 0 };
    t -= quieto(i);

    if (t < paso) {
      return { indiceActual: i, indiceSiguiente: siguiente, transicion: paso > 0 ? t / paso : 0 };
    }
    t -= paso;
  }

  return { indiceActual: 0, indiceSiguiente: 1, transicion: 0 };
}
