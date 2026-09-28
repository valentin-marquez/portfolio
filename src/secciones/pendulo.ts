// Un pase colgado de su cinta es un péndulo amortiguado: el viento le cambia el ángulo de reposo y el
// puntero, al pasar, le da un empujón. Ángulos en grados, tiempo en segundos.
export interface Pendulo {
  angulo: number;
  velocidad: number;
}

/** ningún pase gira más que esto, empuje lo que empuje */
export const GIRO_MAX = 8;

export function pasoPendulo(p: Pendulo, objetivo: number, dt: number): void {
  // pasos cortos: al volver de una pestaña oculta el péndulo no se dispara
  const h = Math.min(Math.max(dt, 0), 1 / 30);
  const aceleracion = -38 * (p.angulo - objetivo) - 3.6 * p.velocidad;
  p.velocidad += aceleracion * h;
  p.angulo = Math.min(GIRO_MAX, Math.max(-GIRO_MAX, p.angulo + p.velocidad * h));
}
