/**
 * Paleta de la pieza.
 *
 * No son colores elegidos: están extraídos del arte clave
 * (docs/referencias/direccion-visual-key-art.png) y verificados en OKLCH.
 * Ver docs/superpowers/specs/2026-09-11-pieza-3d-grafica-design.md §2.0.
 *
 * Dos hechos que conviene no olvidar al usarlos:
 *
 * - `tinta` ocupa el 42,6% del arte clave. La pieza es negra con campos cálidos
 *   encima, no al revés.
 * - Solo `crema` es una banda real de luz/medio/sombra (deriva de tono 3,6°).
 *   `mostaza` y `naranja` son colores independientes, no dos pasos de una rampa:
 *   entre ellos hay 35° de tono. Para construir sus bandas hay que generarlas en
 *   OKLCH con tono constante, nunca interpolando entre los dos.
 */

export const paleta = {
  tinta: "#171717",
  masa: "#403931",
  cremaLuz: "#f7deae",
  cremaMedio: "#e6c281",
  cremaSombra: "#aa8d5c",
  mostaza: "#f4b528",
  naranja: "#c65b1a",
  verde: "#288020",
} as const;

export type NombreColor = keyof typeof paleta;

/** El mismo color en el 0..1 que esperan los uniforms y los materiales de three. */
export function aVec3(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Contraste sobre `tinta`, medido en WCAG 2 (ver §2.0 del diseño):
 * crema 13,67:1 y mostaza 9,81:1 valen para cualquier texto; naranja 4,19:1 y
 * verde 3,58:1 solo para texto grande; `masa` 1,58:1 no lleva texto nunca.
 */
export const soloTextoGrande: readonly NombreColor[] = ["naranja", "verde"];
export const nuncaLlevaTexto: readonly NombreColor[] = ["masa"];
