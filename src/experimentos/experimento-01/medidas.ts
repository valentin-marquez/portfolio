// Cuentas de la página que no necesitan DOM: se prueban en Node.

/** cuánto se achica la tarjeta para caber con el cromo arriba y el aviso abajo (nunca se agranda) */
export function escalaTarjeta(
  ancho: number,
  alto: number,
  anchoVentana: number,
  altoVentana: number,
): number {
  return Math.min(1, (anchoVentana - 32) / ancho, (altoVentana - 96) / alto);
}

const REVUELTO = "#%@$&!?0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** el texto de la cinta mientras se descifra: con k = 0 todo revuelto, con k = 1 el texto final */
export function descifrar(final: string, k: number, r: () => number): string {
  return [...final]
    .map((c, i) =>
      c === " " || i < k * final.length ? c : (REVUELTO[Math.floor(r() * REVUELTO.length)] ?? c),
    )
    .join("");
}

/** distancia de la cámara para que la tarjeta (altoMundo unidades) mida en pantalla altoTarjetaPx */
export function distanciaPara(
  altoTarjetaPx: number,
  altoVentanaPx: number,
  fovGrados: number,
  altoMundo: number,
): number {
  const visible = (altoMundo * altoVentanaPx) / altoTarjetaPx;
  return visible / 2 / Math.tan((fovGrados * Math.PI) / 360);
}

/** segundos que avanza el reloj en un cuadro: nunca hacia atrás y con tope de 50 ms (al volver de una
 pestaña oculta sigue donde iba, sin saltarse ni repetir sonidos) */
export function pasoReloj(ahora: number, antes: number): number {
  return Math.min(0.05, Math.max(0, (ahora - antes) / 1000));
}

/** la promesa, o null si falla o no llega a tiempo: la página nunca queda esperando para siempre */
export function conPlazo<T>(promesa: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promesa.catch(() => null),
    new Promise<null>((ok) => setTimeout(() => ok(null), ms)),
  ]);
}
