// El reloj de la animación: sigue al audio cuando suena y al navegador si no. Cada vez que lee al
// audio se realinea, así que si el audio se calla la animación continúa desde donde iba.

/** posición dentro del loop para un reloj que empezó en `inicio` */
export function posicionEnLoop(ahora: number, inicio: number, duracion: number): number {
  return (((ahora - inicio) % duracion) + duracion) % duracion;
}

export interface FuenteTiempo {
  /** segundos dentro del loop, o null si todavía no suena */
  posicion(): number | null;
}

export function crearReloj(ahora: () => number) {
  let origen = ahora();
  let pausadoEn: number | null = null;
  let fuente: FuenteTiempo | null = null;

  const leer = (): number => {
    if (pausadoEn !== null) return pausadoEn;
    const a = fuente?.posicion() ?? null;
    if (a !== null) {
      origen = ahora() - a;
      return a;
    }
    return ahora() - origen;
  };

  return {
    t: leer,
    fijar(t: number) {
      if (pausadoEn !== null) pausadoEn = t;
      else origen = ahora() - t;
    },
    pausar() {
      if (pausadoEn === null) pausadoEn = leer();
    },
    reanudar() {
      if (pausadoEn === null) return;
      origen = ahora() - pausadoEn;
      pausadoEn = null;
    },
    get pausado() {
      return pausadoEn !== null;
    },
    conectar(f: FuenteTiempo | null) {
      fuente = f;
    },
  };
}
