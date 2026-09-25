// Campo de viento compartido. La ráfaga es analítica y se calcula en la CPU una vez por cuadro;
// el pasto la recibe como uniform, así el pasto, las semillas y el audio ven exactamente la misma ola.
// El detalle fino del pasto (ruido) vive solo en el shader.

export interface Rafaga {
  /** 0 en calma, hasta 1 en el centro de la ráfaga más fuerte */
  fuerza: number;
  /** posición del frente en x normalizado de pantalla; va de -0.3 a 1.3 durante la ráfaga */
  frente: number;
}

export const PERIODO_RAFAGA = 11;
const DURACION = 0.55; // fracción del ciclo que dura la ráfaga

export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function suave(a: number, b: number, v: number): number {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function rafaga(t: number, semilla = 0): Rafaga {
  const i = Math.floor(t / PERIODO_RAFAGA);
  const k = t / PERIODO_RAFAGA - i;
  const inicio = 0.1 + 0.25 * hash(i + semilla * 17.13);
  const u = Math.min(1, Math.max(0, (k - inicio) / DURACION));
  const activa = k >= inicio && k <= inicio + DURACION;
  const amplitud = 0.6 + 0.4 * hash(i + 7 + semilla);
  const fuerza = activa ? Math.sin(Math.PI * suave(0, 1, u)) ** 2 * amplitud : 0;
  return { fuerza, frente: -0.3 + 1.6 * u };
}

export function vientoEn(x: number, t: number, semilla = 0, extra = 0): number {
  const r = rafaga(t, semilla);
  const calma = Math.sin(t * 0.35 - x * 2.1) * 0.035 + Math.sin(t * 0.9 - x * 5.3) * 0.015;
  const ola = Math.exp(-(((x - r.frente) / 0.2) ** 2)) * r.fuerza;
  return calma + ola * (0.3 + extra);
}

/** Intensidad global del viento (para el audio y las semillas), en [0, 1]. */
export function intensidad(t: number, semilla = 0, extra = 0): number {
  return Math.min(1, Math.max(0, rafaga(t, semilla).fuerza * (1 + extra) + extra * 0.5));
}

export const TOPE_INFLUENCIA = 0.25;

/** El visitante influye en el viento, no lo controla: objetivo acotado y seguimiento lento. */
export function influenciaScroll(anterior: number, velocidadPx: number, dt: number): number {
  const objetivo = Math.min(Math.abs(velocidadPx) / 2000, 1) * TOPE_INFLUENCIA;
  const k = 1 - Math.exp(-dt * 1.2);
  return anterior + (objetivo - anterior) * k;
}
