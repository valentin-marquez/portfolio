// El gráfico: el número entra rodando, la línea se dibuja sola y el tooltip sigue al cursor.
import { mezclarCss } from "../color";
import { COLOR, GRAFICO, valorEnX, yCurva } from "../disposicion";
import {
  HOVER,
  inicioDe,
  LINEA_DIBUJA,
  PALETA_T,
  RETRASO_ENTRADA,
  ventanasDe,
  xHover,
} from "../guion";
import { paso, pistaCiclica, R } from "../resortes";
import { clamp01, en } from "../util";
import { cubrimiento, formatoMiles } from "./calculos";
import { aplicarAspecto, colocar, div } from "./dom";
import { aspecto, visibilidad } from "./intercambio";
import type { Capa } from "./tipos";

const SVG = "http://www.w3.org/2000/svg";

export function crearGrafico(mundo: HTMLElement): Capa {
  const grupo = div("grupo", mundo);
  const pestanas = GRAFICO.pestanas.nombres.map((n) => div("texto pestana-chica", grupo, n));
  const numero = div("texto numero", grupo);
  const etiqueta = div("texto etiqueta-grafico", grupo, "visitas");

  const { x0, x1, y0, y1 } = GRAFICO.area;
  const ancho = x1 - x0;
  const alto = y1 - y0 + 8;
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", String(ancho));
  svg.setAttribute("height", String(alto));
  svg.setAttribute("viewBox", `0 0 ${ancho} ${alto}`);
  svg.style.overflow = "visible";
  const linea = document.createElementNS(SVG, "path");
  const puntos = Array.from({ length: 121 }, (_, i) => {
    const x = x0 + (i / 120) * ancho;
    return `${(x - x0).toFixed(2)} ${(yCurva(x) - (y0 - 4)).toFixed(2)}`;
  });
  linea.setAttribute("d", `M${puntos.join("L")}`);
  linea.setAttribute("fill", "none");
  linea.setAttribute("stroke", COLOR.verde);
  linea.setAttribute("stroke-width", "2");
  linea.setAttribute("stroke-linecap", "round");
  linea.setAttribute("stroke-linejoin", "round");
  linea.setAttribute("pathLength", "1");
  linea.style.strokeDasharray = "1 1";
  svg.appendChild(linea);
  grupo.appendChild(svg);

  const guia = div("guia", grupo);
  guia.style.height = `${y1 - y0}px`;
  const punto = div("punto", grupo);
  const globo = div("mono globo", grupo);

  const hover = pistaCiclica([
    { t: HOVER.t0, a: 1, r: R.firme },
    { t: PALETA_T.abre, a: 0, r: R.salida },
  ]);
  const entra = inicioDe("grafico") + RETRASO_ENTRADA;
  const ventanas = ventanasDe("grafico");

  return (t, f, c) => {
    aplicarAspecto(grupo, aspecto(visibilidad(t, ventanas), c.zoom));
    pestanas.forEach((e, i) => {
      const x = en(GRAFICO.pestanas.xs, i);
      const tapa = cubrimiento(f.pieza.L, f.pieza.R, x, 12) * f.pieza.opacidad;
      e.style.color = mezclarCss(COLOR.gris, COLOR.blanco, tapa);
      colocar(e, x, GRAFICO.pestanas.y);
    });

    // el número rueda de 79.000 a 84.320 mientras entra
    // sin pasarse del total: el sobreimpulso del resorte se leería como otra cifra
    const n = Math.min(GRAFICO.total, GRAFICO.total - 5320 * (1 - paso(t - entra, R.suave)));
    numero.textContent = formatoMiles(n);
    colocar(numero, GRAFICO.numero.x, GRAFICO.numero.y, { ancla: "izquierda" });
    colocar(etiqueta, GRAFICO.etiqueta.x, GRAFICO.etiqueta.y, { ancla: "izquierda" });

    linea.style.strokeDashoffset = (1 - clamp01(paso(t - LINEA_DIBUJA, R.camara))).toFixed(4);
    colocar(svg, x0, (y0 + y1) / 2, { ancla: "izquierda" });

    const h = clamp01(hover(t));
    const x = xHover(Math.min(Math.max(t, HOVER.t0), HOVER.t1));
    const y = yCurva(x);
    for (const e of [guia, punto, globo]) e.style.opacity = h.toFixed(3);
    colocar(guia, x, (y0 + y1) / 2);
    colocar(punto, x, y, { escala: 0.6 + 0.4 * h });
    globo.textContent = formatoMiles(valorEnX(x) * 1000);
    colocar(globo, x, y - 20);
  };
}
