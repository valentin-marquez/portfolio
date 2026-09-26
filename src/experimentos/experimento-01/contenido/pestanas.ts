// Las pestañas: la pieza líquida es el indicador; cada etiqueta se vuelve blanca según cuánto la tapa.
import { mezclarCss } from "../color";
import { COLOR, PESTANAS } from "../disposicion";
import { CLICS, presionar, soltar, ventanasDe } from "../guion";
import { pistaCiclica, R } from "../resortes";
import { en } from "../util";
import { cubrimiento } from "./calculos";
import { aplicarAspecto, colocar, div } from "./dom";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearPestanas(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const etiquetas = PESTANAS.nombres.map((n) => div("texto pestana", grupo, n));
  const hunden = PESTANAS.xs.map((x) =>
    pistaCiclica(
      CLICS.filter((c) => c.hunde === "pestana" && Math.abs(c.x - x) < PESTANAS.ancho / 2).flatMap(
        (c) => [
          { t: presionar(c.t), a: 1, r: R.salida },
          { t: soltar(c.t), a: 0, r: R.firme },
        ],
      ),
    ),
  );
  const ventanas = ventanasDe("pestanas");
  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    etiquetas.forEach((e, i) => {
      const x = en(PESTANAS.xs, i);
      const tapa = cubrimiento(f.pieza.L, f.pieza.R, x, 14) * f.pieza.opacidad;
      e.style.color = mezclarCss(COLOR.gris, COLOR.blanco, tapa);
      colocar(e, x, f.cy, { escala: 1 - 0.06 * en(hunden, i)(t) });
    });
  };
}
