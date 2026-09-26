// Ayudas para armar el contenido: elementos posicionados en px de diseño dentro del mundo.
import { TRAZO } from "./iconos";
import type { Aspecto } from "./intercambio";

const SVG = "http://www.w3.org/2000/svg";

export function div(clase: string, padre: Element, texto?: string): HTMLDivElement {
  const e = document.createElement("div");
  e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  padre.appendChild(e);
  return e;
}

/** un ícono de la grilla de 24; los de línea llevan el mismo trazo en px de diseño a cualquier tamaño */
export function icono(
  padre: Element,
  lado: number,
  caminos: readonly { d: string; relleno?: boolean }[],
): { svg: SVGSVGElement; caminos: SVGPathElement[] } {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "icono");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(lado));
  svg.setAttribute("height", String(lado));
  const hechos = caminos.map(({ d, relleno }) => {
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", d);
    if (relleno) {
      p.setAttribute("fill", "currentColor");
    } else {
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", String((TRAZO * 24) / lado));
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
    }
    svg.appendChild(p);
    return p;
  });
  padre.appendChild(svg);
  return { svg, caminos: hechos };
}

export interface Colocacion {
  ancla?: "centro" | "izquierda" | "derecha";
  escala?: number;
  giro?: number;
}

/** ubica un elemento para que su punto de anclaje (centrado en vertical) caiga en (x, y) */
export function colocar(
  e: HTMLElement | SVGElement,
  x: number,
  y: number,
  { ancla = "centro", escala = 1, giro = 0 }: Colocacion = {},
): void {
  const ax = ancla === "centro" ? "-50%" : ancla === "izquierda" ? "0%" : "-100%";
  e.style.transform = `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px) translate(${ax}, -50%) rotate(${giro.toFixed(2)}deg) scale(${escala.toFixed(4)})`;
}

interface ConEstilo {
  style: { opacity: string; filter: string; transform: string; visibility: string };
}

/** un grupo del todo visible no lleva filtro: con filtro, Chrome lo rasteriza aparte y el texto pierde nitidez */
export function aplicarAspecto(e: ConEstilo, a: Aspecto): void {
  e.style.opacity = a.opacidad.toFixed(4);
  e.style.filter = a.desenfoque > 0.01 ? `blur(${a.desenfoque.toFixed(3)}px)` : "none";
  e.style.transform = `scale(${a.escala.toFixed(4)})`;
  e.style.visibility = a.opacidad < 0.002 ? "hidden" : "visible";
}
