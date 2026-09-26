// El volumen: se arrastra hasta el máximo y más allá; la barra se estira con la goma de la forma.
import { VOLUMEN } from "../disposicion";
import { ARRASTRE_VOLUMEN, valorVolumen, ventanasDe } from "../guion";
import { pistaCiclica, R } from "../resortes";
import { pulso } from "../tiempo";
import { clamp01, en } from "../util";
import { aplicarAspecto, colocar, div, icono } from "./dom";
import { ICONOS } from "./iconos";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearVolumen(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const parlante = icono(grupo, 18, [
    { d: ICONOS.parlante },
    { d: ICONOS.onda1 },
    { d: ICONOS.onda2 },
  ]);
  parlante.svg.style.color = "#fff";
  const onda1 = en(parlante.caminos, 1);
  const onda2 = en(parlante.caminos, 2);
  const fondo = div("volumen-fondo", grupo);
  const relleno = div("volumen-relleno", grupo);
  // tras soltar queda al máximo; ya oculto, vuelve al valor inicial para el próximo ciclo
  const valor = pistaCiclica([
    { ...ARRASTRE_VOLUMEN, valor: valorVolumen, a: 1, r: R.firme },
    { t: pulso(15.5), a: VOLUMEN.inicial, r: R.firme },
  ]);
  const ventanas = ventanasDe("volumen");
  const { x0, x1 } = VOLUMEN.barra;

  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    const v = clamp01(valor(t));
    const e = f.estiramiento;
    colocar(parlante.svg, VOLUMEN.parlante.x, f.cy);
    onda1.style.opacity = clamp01(v * 3).toFixed(3);
    onda2.style.opacity = clamp01(v * 2 - 0.6).toFixed(3);
    fondo.style.width = `${(x1 - x0 + e).toFixed(3)}px`;
    colocar(fondo, x0, f.cy, { ancla: "izquierda" });
    relleno.style.width = `${Math.max(6, v * (x1 - x0) + e).toFixed(3)}px`;
    colocar(relleno, x0, f.cy, { ancla: "izquierda" });
  };
}
