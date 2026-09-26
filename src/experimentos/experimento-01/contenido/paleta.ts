// La paleta ⌘K: se escribe «cuadro» letra a letra, la lista se filtra y se reacomoda, y el enter
// hunde en negro la fila elegida (la pieza líquida es el resalte).
import { mezclarCss } from "../color";
import { COLOR, PALETA } from "../disposicion";
import { filtros, letrasEn, PALETA_T, TECLAS, ventanasDe } from "../guion";
import { pistaCiclica, R } from "../resortes";
import { clamp01, en } from "../util";
import { aplicarAspecto, colocar, div, icono } from "./dom";
import { ICONOS } from "./iconos";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

export function crearPaleta(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const lupa = icono(grupo, 18, [{ d: ICONOS.lupa }]).svg;
  lupa.style.color = COLOR.tenue;
  const linea = div("texto linea-entrada", grupo);
  const escrito = div("", linea);
  const caret = div("caret", linea);
  const marcador = div("marcador", linea, PALETA.marcador);
  const divisor = div("divisor", grupo);

  const cambios = filtros();
  const filas = PALETA.items.map((item, i) => ({
    icono: icono(grupo, 16, [{ d: ICONOS[item.icono] }]).svg,
    texto: div("texto fila-texto", grupo, item.texto),
    atajo: div("mono atajo", grupo, item.atajo),
    visible: pistaCiclica([
      ...cambios.map((c) => ({ t: c.t, a: en(c.visibles, i) ? 1 : 0, r: R.firme })),
      { t: PALETA_T.reinicia, a: 1, r: R.firme },
    ]),
  }));
  const enter = pistaCiclica([
    { t: PALETA_T.enter, a: 1, r: R.rapido },
    { t: PALETA_T.reinicia, a: 0, r: R.rapido },
  ]);
  const ventanas = ventanasDe("paleta");

  return (t, _f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    const { entrada, filas: F } = PALETA;
    colocar(lupa, entrada.xIcono, entrada.y);
    const n = letrasEn(t);
    escrito.textContent = PALETA.consulta.slice(0, n);
    marcador.style.display = n === 0 ? "block" : "none";
    // el caret queda fijo mientras se escribe y parpadea cuando no
    let ultima = Number.NEGATIVE_INFINITY;
    for (const k of TECLAS) if (k <= t) ultima = k;
    caret.style.opacity = t - ultima < 0.4 || (t / 0.53) % 1 < 0.55 ? "1" : "0";
    colocar(linea, entrada.xTexto, entrada.y, { ancla: "izquierda" });
    colocar(divisor, 0, PALETA.divisor);

    const e = clamp01(enter(t));
    let antes = 0;
    for (const fila of filas) {
      const v = clamp01(fila.visible(t));
      const y = F.y0 + F.paso * antes;
      // la primera fila visible queda bajo el resalte: con el enter se vuelve blanca
      const elegida = e * clamp01(1 - antes) * v;
      const tinta = mezclarCss(COLOR.tinta, COLOR.blanco, elegida);
      fila.icono.style.color = tinta;
      fila.texto.style.color = tinta;
      fila.atajo.style.color = mezclarCss(COLOR.tenue, "#c9c7bf", elegida);
      for (const el of [fila.icono, fila.texto, fila.atajo]) el.style.opacity = v.toFixed(3);
      colocar(fila.icono, F.xIcono, y);
      colocar(fila.texto, F.xTexto, y, { ancla: "izquierda" });
      colocar(fila.atajo, F.xAtajo, y, { ancla: "derecha" });
      antes += v;
    }
  };
}
