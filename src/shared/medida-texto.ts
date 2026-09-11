/**
 * Medidas del texto que se dibuja en el lienzo 2D antes de subirlo como textura.
 *
 * Va aparte del dibujado a propósito: esto es aritmética y se puede probar; lo
 * otro toca el canvas y no.
 */

/**
 * Tamaño en píxeles que hace que el texto quepa en el ancho disponible, sin
 * pasar del máximo.
 */
export function tamañoQueEncaja(
  anchoMedido: number,
  tamañoMedido: number,
  anchoObjetivo: number,
  tamañoMaximo: number,
): number {
  // con la cadena vacía, o con la fuente todavía sin cargar, la medida sale 0;
  // dividir ahí devolvería infinito
  if (anchoMedido <= 0) return tamañoMaximo;
  return Math.min(tamañoMaximo, (tamañoMedido * anchoObjetivo) / anchoMedido);
}

/** Alto partido por ancho, para mapear la textura a un plano sin deformarla. */
export function relacionAspecto(ancho: number, alto: number): number {
  if (ancho <= 0) return 1;
  return alto / ancho;
}
