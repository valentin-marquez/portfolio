// El check: se dibuja en blanco sobre el círculo verde.
import { inicioDe, RETRASO_ENTRADA, ventanasDe } from "../guion";
import { paso, R } from "../resortes";
import { en } from "../util";
import { aplicarAspecto, colocar, div, icono } from "./dom";
import { ICONOS } from "./iconos";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearCheck(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const { svg, caminos } = icono(grupo, 22, [{ d: ICONOS.check }]);
  svg.style.color = "#fff";
  const trazo = en(caminos, 0);
  trazo.setAttribute("pathLength", "1");
  trazo.style.strokeDasharray = "1 1";
  const ventanas = ventanasDe("check");
  const desde = inicioDe("check") + RETRASO_ENTRADA;
  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    trazo.style.strokeDashoffset = (1 - paso(t - desde, R.suave)).toFixed(4);
    colocar(svg, f.cx, f.cy);
  };
}
