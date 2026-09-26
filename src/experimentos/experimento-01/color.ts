// Colores de la forma. Se interpolan en OKLab para que negro → verde → blanco no pase por grises
// sucios; las matrices son las de Björn Ottosson.
import { pistaCiclica, type Resorte } from "./resortes";

export type Rgb = [number, number, number];

export function hexARgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const aLineal = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const aGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbAOklab([r8, g8, b8]: Rgb): Rgb {
  const r = aLineal(r8);
  const g = aLineal(g8);
  const b = aLineal(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabARgb([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const limitar = (c: number) => Math.min(1, Math.max(0, aGamma(c)));
  return [
    limitar(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    limitar(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    limitar(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function css([r, g, b]: Rgb, alfa = 1): string {
  const canal = (c: number) => Math.round(c * 255);
  const base = `${canal(r)} ${canal(g)} ${canal(b)}`;
  return alfa === 1 ? `rgb(${base})` : `rgb(${base} / ${alfa})`;
}

/** mezcla dos colores #rrggbb en OKLab; k = 0 da `a`, k = 1 da `b` */
export function mezclarCss(a: string, b: string, k: number): string {
  const x = rgbAOklab(hexARgb(a));
  const y = rgbAOklab(hexARgb(b));
  return css(
    oklabARgb([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]),
  );
}

export interface CambioColor {
  t: number;
  color: string;
  r: Resorte;
}

/** un color que cambia con resortes; cada canal de OKLab es una pista periódica */
export function pistaColor(cambios: readonly CambioColor[]): (t: number) => Rgb {
  const lab = cambios.map((c) => ({ t: c.t, lab: rgbAOklab(hexARgb(c.color)), r: c.r }));
  const L = pistaCiclica(lab.map((c) => ({ t: c.t, a: c.lab[0], r: c.r })));
  const A = pistaCiclica(lab.map((c) => ({ t: c.t, a: c.lab[1], r: c.r })));
  const B = pistaCiclica(lab.map((c) => ({ t: c.t, a: c.lab[2], r: c.r })));
  return (t) => oklabARgb([L(t), A(t), B(t)]);
}
