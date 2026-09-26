// El botón «Renderizar»: una etiqueta que se hunde con la forma al presionarla.
import { ventanasDe } from "../guion";
import { aplicarAspecto, colocar, div } from "./dom";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearBoton(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const etiqueta = div("texto etiqueta-boton", grupo, "Renderizar");
  const ventanas = ventanasDe("boton");
  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    colocar(etiqueta, f.cx, f.cy, { escala: 1 - 0.04 * f.hundido });
  };
}
