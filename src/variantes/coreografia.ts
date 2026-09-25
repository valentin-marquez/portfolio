// Coreografías de scroll de las variantes, como funciones puras: la página solo las lee.
import type { Parametros } from "@/prado/parametros";
import { suave } from "@/prado/viento";

const limitar = (p: number) => Math.min(1, Math.max(0, p));

/**
 * Variante 1: el hero queda fijo mientras la sección pasa (p de 0 a 1). Primero se va el título,
 * después el prado se desvanece y se achica apenas; la cámara sube despacio todo el tramo.
 */
export function heroQueSeQueda(progreso: number) {
  const p = limitar(progreso);
  return {
    titulo: { opacidad: 1 - suave(0.2, 0.55, p), y: -90 * suave(0, 0.6, p) },
    prado: { opacidad: 1 - suave(0.55, 0.95, p), escala: 1 - 0.05 * suave(0.3, 1, p) },
    camara: { dAltura: 1.1 * suave(0, 1, p), dMirarY: -0.5 * suave(0, 1, p) },
  };
}

export function camaraSegunScroll(
  base: Parametros["camara"],
  progreso: number,
): Parametros["camara"] {
  const { camara } = heroQueSeQueda(progreso);
  if (camara.dAltura === 0 && camara.dMirarY === 0) return base;
  return { ...base, altura: base.altura + camara.dAltura, mirarY: base.mirarY + camara.dMirarY };
}

type Rect = { top: number; bottom: number; left: number; width: number; height: number };

/**
 * Variante 2: la parte del prado fijo que no tapa la hoja de contenido (su tramo opaco), en px de
 * viewport; null si la hoja lo tapa entero. Sirve para pausar el render y para que las semillas solo
 * aterricen donde el prado se ve.
 */
export function zonaDescubierta(
  prado: Rect,
  hojaOpaca: { top: number; bottom: number },
): Rect | null {
  const tapaArriba = hojaOpaca.top <= prado.top;
  const tapaAbajo = hojaOpaca.bottom >= prado.bottom;
  if (hojaOpaca.bottom <= prado.top || hojaOpaca.top >= prado.bottom) return prado;
  if (tapaArriba && tapaAbajo) return null;
  const top = tapaArriba ? hojaOpaca.bottom : prado.top;
  const bottom = tapaArriba ? prado.bottom : hojaOpaca.top;
  return { ...prado, top, bottom, height: bottom - top };
}
