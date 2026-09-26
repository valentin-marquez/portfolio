// El cargador: un arco que gira y, desde el pulso 3, se va cerrando.
import { CARGADOR_CIERRA, inicioDe, ventanasDe } from "../guion";
import { paso, R } from "../resortes";
import { en } from "../util";
import { aplicarAspecto, colocar, div, icono } from "./dom";
import { ICONOS } from "./iconos";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearCargador(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const { svg, caminos } = icono(grupo, 22, [{ d: ICONOS.circulo }]);
  svg.style.color = "#fff";
  const arco = en(caminos, 0);
  arco.setAttribute("pathLength", "1");
  const ventanas = ventanasDe("cargador");
  const desde = inicioDe("cargador");
  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    const largo = 0.22 + 0.7 * paso(t - CARGADOR_CIERRA, R.suave);
    arco.style.strokeDasharray = `${largo.toFixed(4)} 1`;
    colocar(svg, f.cx, f.cy, { giro: (t - desde) * 540 });
  };
}
