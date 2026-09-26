// La cámara (zoom en escala logarítmica, para que acercarse y alejarse se sientan parejos, y un
// centro que sigue a la paleta cuando se encoge) y la vista, que adapta el cuadrado de diseño de
// 1440 a cualquier contenedor.
import { CAJAS } from "./disposicion";
import { CENTROS_Y, TRAMOS } from "./guion";
import { pistaCiclica, R } from "./resortes";
import { LADO } from "./tiempo";

export interface Camara {
  x: number;
  y: number;
  zoom: number;
}

const logZoom = pistaCiclica(
  TRAMOS.slice(1).map((tr) => ({ t: tr.desde, a: Math.log(CAJAS[tr.estado].zoom), r: R.camara })),
);
const centroY = pistaCiclica(CENTROS_Y.map((c) => ({ t: c.t, a: c.y, r: R.camara })));

export function camaraEn(t: number): Camara {
  return { x: 0, y: centroY(t), zoom: Math.exp(logZoom(t)) };
}

/** el contenedor en px CSS; `escala` pasa px del cuadrado de 1440 a px del contenedor */
export interface Vista {
  w: number;
  h: number;
  escala: number;
}

/** la escala sale del alto sobre 1440, salvo en pantallas angostas (teléfonos): ahí del ancho sobre
 *  1000, que es lo que ocupa el estado más ancho con aire a los lados */
export function vistaPara(w: number, h: number): Vista {
  return { w, h, escala: Math.min(w / 1000, h / LADO) };
}

export const VISTA_CUADRADA: Vista = vistaPara(LADO, LADO);

/** de px de diseño a px del contenedor */
export function aPantalla(c: Camara, v: Vista, x: number, y: number): [number, number] {
  const z = c.zoom * v.escala;
  return [v.w / 2 + (x - c.x) * z, v.h / 2 + (y - c.y) * z];
}
