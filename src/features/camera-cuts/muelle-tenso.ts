/**
 * Integrador de muelle.
 *
 * Se amortigua LA CÁMARA, nunca el scroll (§4.4 del diseño): amortiguar el
 * scroll se siente blando y con lag en trackpad, porque el sistema ya aporta
 * su propia inercia.
 */

export type EstadoMuelle = { valor: number; velocidad: number };

export type AjusteMuelle = {
  rigidez: number;
  amortiguacion: number;
};

/** Paso de integración fijo: por encima de esto el método de Euler se va. */
const SUBPASO = 1 / 120;

/**
 * Tope de tiempo que se simula de una vez. Una pestaña en segundo plano vuelve
 * con saltos de medio segundo o más; simularlos enteros hace que la cámara
 * aparezca de golpe donde no toca, así que se descartan.
 */
const SALTO_MAXIMO = 0.1;

export function pasoMuelle(
  estado: EstadoMuelle,
  objetivo: number,
  ajuste: AjusteMuelle,
  dt: number,
): EstadoMuelle {
  if (dt <= 0) return estado;

  let { valor, velocidad } = estado;
  let restante = Math.min(dt, SALTO_MAXIMO);

  while (restante > 0) {
    const h = Math.min(restante, SUBPASO);
    const aceleracion = ajuste.rigidez * (objetivo - valor) - ajuste.amortiguacion * velocidad;
    // Euler semi-implícito: la velocidad se actualiza antes que la posición.
    // Conserva mejor la energía que el explícito y no se va con el tiempo.
    velocidad += aceleracion * h;
    valor += velocidad * h;
    restante -= h;
  }

  return { valor, velocidad };
}
