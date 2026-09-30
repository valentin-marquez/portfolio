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
