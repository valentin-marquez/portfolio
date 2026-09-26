// El reproductor: la canción real con su tiempo real (el mismo audio de la pieza), pausa con morph
// de ícono y una barra que se frota con el cursor.
import { REPRODUCTOR } from "../disposicion";
import {
  CLICS,
  PROGRESO,
  presionar,
  REPRODUCIENDO,
  soltar,
  tiempoCancion,
  ventanasDe,
} from "../guion";
import { pistaCiclica, R } from "../resortes";
import { clamp01, en } from "../util";
import { formatoTiempo } from "./calculos";
import { aplicarAspecto, colocar, div, icono } from "./dom";
import { ICONOS, playPausa } from "./iconos";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearReproductor(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const titulo = div("texto titulo-cancion", grupo, "Cumbia B");
  const artista = div("texto artista", grupo, "KAIRONVOSS");
  const fondo = div("barra-fondo", grupo);
  const relleno = div("barra-relleno", grupo);
  const perilla = div("perilla", grupo);
  const actual = div("mono tiempo", grupo);
  const resta = div("mono tiempo", grupo);
  const anterior = icono(grupo, 18, [{ d: ICONOS.anterior, relleno: true }]).svg;
  const siguiente = icono(grupo, 18, [{ d: ICONOS.siguiente, relleno: true }]).svg;
  const boton = icono(grupo, 22, [{ d: playPausa(1), relleno: true }]);
  const forma = en(boton.caminos, 0);
  for (const s of [anterior, siguiente, boton.svg]) s.classList.add("control");

  const sonando = pistaCiclica(REPRODUCIENDO.map((e) => ({ t: e.t, a: e.a, r: R.firme })));
  const agarre = pistaCiclica([
    { t: presionar(PROGRESO.t0), a: 1, r: R.rapido },
    { t: PROGRESO.t1 + 0.05, a: 0, r: R.firme },
  ]);
  const hundePlay = pistaCiclica(
    CLICS.filter((c) => c.hunde === "play").flatMap((c) => [
      { t: presionar(c.t), a: 1, r: R.salida },
      { t: soltar(c.t), a: 0, r: R.firme },
    ]),
  );
  const ventanas = ventanasDe("reproductor");
  const { x0, x1, y } = REPRODUCTOR.barra;
  const largo = x1 - x0;
  fondo.style.width = `${largo}px`;

  return (t, _f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    colocar(titulo, REPRODUCTOR.titulo.x, REPRODUCTOR.titulo.y, { ancla: "izquierda" });
    colocar(artista, REPRODUCTOR.subtitulo.x, REPRODUCTOR.subtitulo.y, { ancla: "izquierda" });

    const s = tiempoCancion(t);
    const p = clamp01(s / REPRODUCTOR.duracion);
    colocar(fondo, x0, y, { ancla: "izquierda" });
    relleno.style.width = `${(p * largo).toFixed(3)}px`;
    colocar(relleno, x0, y, { ancla: "izquierda" });
    colocar(perilla, x0 + p * largo, y, { escala: clamp01(agarre(t)) });
    actual.textContent = formatoTiempo(s);
    resta.textContent = formatoTiempo(s - REPRODUCTOR.duracion);
    colocar(actual, x0, REPRODUCTOR.tiempos.y, { ancla: "izquierda" });
    colocar(resta, x1, REPRODUCTOR.tiempos.y, { ancla: "derecha" });

    const { y: cy, separacion } = REPRODUCTOR.controles;
    colocar(anterior, -separacion, cy);
    colocar(siguiente, separacion, cy);
    forma.setAttribute("d", playPausa(clamp01(sonando(t))));
    colocar(boton.svg, 0, cy, { escala: 1 - 0.12 * hundePlay(t) });
  };
}
