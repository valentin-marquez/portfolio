// Coreografías de scroll de las variantes, como funciones puras: la página solo las lee.
import type { Parametros } from "@/prado/parametros";
import { suave } from "@/prado/viento";

const limitar = (p: number) => Math.min(1, Math.max(0, p));

export const MOVIMIENTOS = ["cielo", "sube", "avanza"] as const;
export type Movimiento = Parametros["movimiento"];

/**
 * Variante 1: el hero queda fijo mientras la sección pasa (p de 0 a 1). Primero se va el título y
 * después el prado. Al mirar al cielo el prado casi no necesita desvanecerse: el cielo ya tiene el
 * tono de la página.
 */
export function heroQueSeQueda(progreso: number, movimiento: Movimiento = "cielo") {
  const p = limitar(progreso);
  const [desde, hasta] = movimiento === "cielo" ? [0.8, 1] : [0.55, 0.95];
  return {
    titulo: { opacidad: 1 - suave(0.15, 0.5, p), y: -90 * suave(0, 0.6, p) },
    prado: {
      opacidad: 1 - suave(desde, hasta, p),
      escala: movimiento === "sube" ? 1 - 0.05 * suave(0.3, 1, p) : 1,
    },
  };
}

/** La cámara del hero según el scroll: parte de la base y llega a la vista del movimiento elegido. */
export function camaraHero(
  base: Parametros["camara"],
  progreso: number,
  movimiento: Movimiento,
): Parametros["camara"] {
  const p = suave(0, 1, limitar(progreso));
  if (p === 0) return base;
  switch (movimiento) {
    case "cielo":
      // levantar la vista: el punto mirado sube muy por sobre el horizonte
      return { ...base, altura: base.altura + 0.3 * p, mirarY: base.mirarY + 7.5 * p };
    case "sube":
      return { ...base, altura: base.altura + 1.1 * p, mirarY: base.mirarY - 0.5 * p };
    case "avanza":
      // caminar hacia adentro del prado, bajando un poco hacia las puntas
      return { ...base, avance: base.avance + 9 * p, altura: base.altura - 0.5 * p };
  }
}

/** En el cierre el recorrido se deshace: desde la vista del movimiento se vuelve a la base. */
export function camaraCierre(
  base: Parametros["camara"],
  progreso: number,
  movimiento: Movimiento,
): Parametros["camara"] {
  return camaraHero(base, 1 - limitar(progreso), movimiento);
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
