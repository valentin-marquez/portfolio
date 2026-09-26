// El toast: un círculo verde con check y «Cada cuadro es código».
import { TOAST } from "../disposicion";
import { inicioDe, RETRASO_ENTRADA, ventanasDe } from "../guion";
import { paso, R } from "../resortes";
import { en } from "../util";
import { aplicarAspecto, colocar, div, icono } from "./dom";
import { ICONOS } from "./iconos";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearToast(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const circulo = div("circulo-toast", grupo);
  const { svg, caminos } = icono(grupo, 12, [{ d: ICONOS.check }]);
  svg.style.color = "#fff";
  const trazo = en(caminos, 0);
  trazo.setAttribute("pathLength", "1");
  trazo.style.strokeDasharray = "1 1";
  const texto = div("texto texto-toast", grupo, "Cada cuadro es código");
  const ventanas = ventanasDe("toast");
  const dibuja = inicioDe("toast") + RETRASO_ENTRADA + 0.08;
  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    const k = paso(t - dibuja, R.suave);
    trazo.style.strokeDashoffset = (1 - k).toFixed(4);
    colocar(circulo, TOAST.check.x, f.cy, { escala: 0.6 + 0.4 * k });
    colocar(svg, TOAST.check.x, f.cy);
    colocar(texto, TOAST.texto.x, f.cy, { ancla: "izquierda" });
  };
}
