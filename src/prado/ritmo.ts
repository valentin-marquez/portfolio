// El ritmo del prado: cuántas veces por segundo se dibuja y con cuánto detalle. Un prado que se mueve
// despacio no necesita 120 cuadros por segundo, así que en pantallas rápidas dibuja uno de cada dos. Y
// si el equipo no alcanza a sostener el ritmo, primero baja las muestras del desenfoque, después pasa a
// 30 cuadros estables y solo al final baja un poco la resolución: en un teléfono de densidad alta, la
// resolución es lo que más se nota (el pasto se pixela). Solo baja, nunca sube: un prado que cambia de
// calidad a cada rato se nota más que uno un poco más lento.

export interface Nivel {
  /** fracción de la resolución que permite la calidad del equipo */
  escala: number;
  /** fracción de las muestras de la profundidad de campo */
  dof: number;
  fps: number;
}

export const NIVELES: readonly Nivel[] = [
  { escala: 1, dof: 1, fps: 60 },
  { escala: 1, dof: 0.7, fps: 60 },
  { escala: 1, dof: 0.7, fps: 30 },
  { escala: 0.85, dof: 0.6, fps: 30 },
];

/** Lo que comparten los prados de la página: el nivel al que llegó cualquiera de ellos, y cifras. */
export const rendimiento = {
  nivel: 0,
  /** cuadros dibujados en el último segundo, sumando los prados */
  fps: 0,
  resolucion: "",
  hojas: 0,
  /** para contar los cuadros */
  cuenta: 0,
  desdeCuenta: 0,
};

export type Rendimiento = typeof rendimiento;

export function nivelActual(r: Rendimiento = rendimiento): Nivel {
  return NIVELES[Math.min(Math.max(0, r.nivel), NIVELES.length - 1)] as Nivel;
}

/** Lo que mide cada prado por su cuenta. */
export interface Medicion {
  ultimo: number | null;
  /** intervalo promedio entre cuadros dibujados (ms) */
  promedio: number | null;
  /** desde cuándo mide con este nivel: los primeros segundos no cuentan */
  desde: number;
}

export function crearMedicion(ahora = 0): Medicion {
  return { ultimo: null, promedio: null, desde: ahora };
}

/** después de una pausa o de volver a la vista se mide de nuevo, sin el hueco */
export function reanudar(m: Medicion, ahora: number): void {
  m.ultimo = null;
  m.promedio = null;
  m.desde = ahora;
}

/**
 * ¿Toca dibujar en este cuadro de la pantalla? Deja pasar hasta dos tercios del intervalo objetivo:
 * a 60 Hz y 90 Hz dibuja siempre, a 120 Hz uno de cada dos, a 144 Hz uno de cada dos (72).
 */
export function tocaDibujar(m: Medicion, ahora: number, r: Rendimiento = rendimiento): boolean {
  const intervalo = 1000 / nivelActual(r).fps;
  return m.ultimo === null || ahora - m.ultimo >= intervalo * 0.66;
}

const CALENTAMIENTO_MS = 2500;

/** Registra un cuadro dibujado; si el promedio queda lejos del objetivo por un rato, baja un nivel. */
export function registrarCuadro(m: Medicion, ahora: number, r: Rendimiento = rendimiento): void {
  if (m.ultimo !== null) {
    const dt = ahora - m.ultimo;
    // un salto largo (pestaña oculta, el scroll trabó un momento) no dice nada del prado
    if (dt < 250) m.promedio = m.promedio === null ? dt : m.promedio + (dt - m.promedio) * 0.03;
  }
  m.ultimo = ahora;

  r.cuenta++;
  if (ahora - r.desdeCuenta >= 1000) {
    r.fps = Math.round((r.cuenta * 1000) / (ahora - r.desdeCuenta));
    r.cuenta = 0;
    r.desdeCuenta = ahora;
  }

  const objetivo = 1000 / nivelActual(r).fps;
  if (
    ahora - m.desde > CALENTAMIENTO_MS &&
    m.promedio !== null &&
    m.promedio > objetivo * 1.3 &&
    r.nivel < NIVELES.length - 1
  ) {
    r.nivel++;
    m.promedio = null;
    m.desde = ahora;
  }
}
