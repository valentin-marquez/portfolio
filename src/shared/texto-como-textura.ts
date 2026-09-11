import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { relacionAspecto, tamañoQueEncaja } from "./medida-texto";

/**
 * Convierte una palabra en textura.
 *
 * Toda la pieza se renderiza: no hay elementos del navegador animados, porque un
 * nodo del DOM se *siente* a DOM —rasterizado de fuente, ajuste a píxel,
 * compositado propio— y mezclado con render rompe la ilusión.
 *
 * El precio es que esto no lo selecciona nadie ni lo lee un lector de pantalla,
 * así que la palabra tiene que ir duplicada en un nodo oculto.
 */

export const FAMILIA_DISPLAY = '"Anton", "Arial Narrow", sans-serif';

const LADO = 1024;
const TAMAÑO_MAXIMO = 300;
const MARGEN = 0.9;

export type TexturaDeTexto = {
  textura: CanvasTexture;
  /** Alto partido por ancho, para no deformar el plano que la lleva. */
  aspecto: number;
};

export function textoComoTextura(texto: string, familia: string): TexturaDeTexto {
  const lienzo = document.createElement("canvas");
  lienzo.width = LADO;
  lienzo.height = Math.round(LADO / 2);

  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Sin contexto 2D: no se puede generar la textura de texto");

  // máscara en blanco sobre negro: el color lo pone el material, no el lienzo,
  // así la misma textura sirve para rellenar, calar o semitonar
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `${TAMAÑO_MAXIMO}px ${familia}`;
  const medido = ctx.measureText(texto).width;
  const tamaño = tamañoQueEncaja(medido, TAMAÑO_MAXIMO, lienzo.width * MARGEN, TAMAÑO_MAXIMO);

  ctx.font = `${tamaño}px ${familia}`;
  ctx.fillStyle = "#fff";
  ctx.fillText(texto, lienzo.width / 2, lienzo.height / 2 + tamaño * 0.04);

  const textura = new CanvasTexture(lienzo);
  textura.colorSpace = SRGBColorSpace;
  textura.minFilter = LinearFilter;
  textura.magFilter = LinearFilter;
  textura.needsUpdate = true;

  return { textura, aspecto: relacionAspecto(lienzo.width, lienzo.height) };
}

/**
 * La fuente tiene que estar cargada ANTES de medir, o se mide con la de reserva
 * y la palabra sale con el tamaño equivocado.
 */
export async function esperarFuente(familia: string): Promise<void> {
  if (!document.fonts?.load) return;
  try {
    await document.fonts.load(`${TAMAÑO_MAXIMO}px ${familia}`);
    await document.fonts.ready;
  } catch {
    // si la fuente no llega se dibuja con la de reserva: peor, pero no roto
  }
}
