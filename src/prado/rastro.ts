// Rastro del puntero: como pasar la mano por el pasto. Cada vez que el puntero avanza sobre el prado
// deja una muestra que inclina las hojas en la dirección del movimiento; las muestras se apagan
// despacio y el pasto vuelve a su lugar. Con el cursor quieto no se agrega nada.

export const MUESTRAS_RASTRO = 12;
/** constante de tiempo de la recuperación del pasto, en segundos */
const RECUPERACION = 1.1;
/** distancia mínima en el suelo (m) para dejar una muestra nueva */
const PASO = 0.03;
/** velocidad (m/s) que da un empuje completo */
const VELOCIDAD_PLENA = 1.5;

export interface Muestra {
  x: number;
  z: number;
  /** dirección del movimiento, normalizada */
  dx: number;
  dz: number;
  fuerza: number;
}

export interface Rastro {
  muestras: Muestra[];
  ultimo: { x: number; z: number } | null;
  /** segundos desde la última muestra: la velocidad se mide sobre ese tramo, no sobre un cuadro */
  desdeUltimo: number;
}

export function crearRastro(): Rastro {
  return { muestras: [], ultimo: null, desdeUltimo: 0 };
}

export function actualizarRastro(
  r: Rastro,
  punto: { x: number; z: number } | null,
  dt: number,
): void {
  const apagado = Math.exp(-dt / RECUPERACION);
  for (const m of r.muestras) m.fuerza *= apagado;
  r.muestras = r.muestras.filter((m) => m.fuerza > 0.01);

  if (!punto) {
    r.ultimo = null;
    return;
  }
  if (!r.ultimo) {
    r.ultimo = { ...punto };
    r.desdeUltimo = 0;
    return;
  }
  r.desdeUltimo += dt;
  const mx = punto.x - r.ultimo.x;
  const mz = punto.z - r.ultimo.z;
  const distancia = Math.hypot(mx, mz);
  if (distancia < PASO || r.desdeUltimo <= 0) return;
  const velocidad = distancia / r.desdeUltimo;
  r.muestras.push({
    x: punto.x,
    z: punto.z,
    dx: mx / distancia,
    dz: mz / distancia,
    fuerza: Math.min(1, velocidad / VELOCIDAD_PLENA),
  });
  if (r.muestras.length > MUESTRAS_RASTRO) r.muestras.shift();
  r.ultimo = { ...punto };
  r.desdeUltimo = 0;
}

/** Uniforme vec4[MUESTRAS_RASTRO]: x, z y el empuje ya ponderado por su fuerza; relleno con ceros. */
export function uniformeRastro(r: Rastro): Float32Array {
  const datos = new Float32Array(MUESTRAS_RASTRO * 4);
  r.muestras.forEach((m, i) => {
    datos.set([m.x, m.z, m.dx * m.fuerza, m.dz * m.fuerza], i * 4);
  });
  return datos;
}
