// La isla dinámica: la carátula la dibuja el WebGL; aquí va el ecualizador, que salta con cada pulso.
import { ISLA } from "../disposicion";
import { ventanasDe } from "../guion";
import { P } from "../tiempo";
import { aplicarAspecto, colocar, div } from "./dom";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearIsla(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const barras = [0, 1, 2, 3].map(() => div("barra-eq", grupo));
  const ventanas = ventanasDe("isla");
  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    barras.forEach((b, i) => {
      // cada barra salta una vez por pulso, un poco después que la anterior
      const alto = 5 + 11 * Math.abs(Math.sin(Math.PI * (t / P + i * 0.31))) ** 1.5;
      b.style.height = `${alto.toFixed(2)}px`;
      colocar(b, ISLA.barras.x + i * ISLA.barras.paso, f.cy);
    });
  };
}
