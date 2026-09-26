// Monta la escena del Experimento 01 en un contenedor: la forma en WebGL2, el contenido en HTML y el
// cursor, adaptados al tamaño del contenedor. Devuelve seek(t); quién mueve el tiempo lo decide quien
// la monta (la página, la tarjeta o las herramientas de captura).
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "./estilos.css";
import { camaraEn, VISTA_CUADRADA, type Vista, vistaPara } from "./camara";
import { crearBoton } from "./contenido/boton";
import { crearCargador } from "./contenido/cargador";
import { crearCheck } from "./contenido/check";
import { crearCursor } from "./contenido/cursor";
import { crearGrafico } from "./contenido/grafico";
import { crearIsla } from "./contenido/isla";
import { crearPestanas } from "./contenido/pestanas";
import { crearReproductor } from "./contenido/reproductor";
import type { Capa } from "./contenido/tipos";
import { crearVolumen } from "./contenido/volumen";
import { formaEn } from "./forma";
import { crearLienzo } from "./gl/lienzo";
import { envolver, LADO } from "./tiempo";

export interface Montaje {
  /** dibuja el instante t (s); cualquier t sirve, se envuelve al loop */
  seek(t: number): void;
  destruir(): void;
}

/** las fuentes se descargan recién cuando algo las usa: esto las pide de antemano */
export function cargarFuentes(): Promise<void> {
  return Promise.all([
    document.fonts.load('400 15px "Geist Sans"'),
    document.fonts.load('500 15px "Geist Sans"'),
    document.fonts.load('600 15px "Geist Sans"'),
    document.fonts.load('400 11px "Geist Mono"'),
    document.fonts.load('500 11px "Geist Mono"'),
  ]).then(() => undefined);
}

function crear<K extends keyof HTMLElementTagNameMap>(etiqueta: K, clase: string, padre: Element) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  padre.appendChild(e);
  return e;
}

/** `cuadrada`: la escena mide 1440×1440 fijo, sin densidad de pantalla (modo captura) */
export function montar(contenedor: HTMLElement, opciones: { cuadrada?: boolean } = {}): Montaje {
  const raiz = crear("div", "escena-01", contenedor);
  if (opciones.cuadrada) {
    raiz.style.width = `${LADO}px`;
    raiz.style.height = `${LADO}px`;
  }
  const canvas = crear("canvas", "", raiz);
  const mundo = crear("div", "mundo", raiz);
  const lienzo = crearLienzo(canvas);
  const capas: Capa[] = [
    crearBoton(mundo),
    crearCargador(mundo),
    crearCheck(mundo),
    crearIsla(mundo),
    crearReproductor(mundo),
    crearVolumen(mundo),
    crearPestanas(mundo),
    crearGrafico(mundo),
  ];
  const cursor = crearCursor(crear("div", "cursor-01", raiz));

  let vista: Vista = VISTA_CUADRADA;
  let dpr = 1;
  let ultimo = 0;

  const medir = () => {
    vista = opciones.cuadrada
      ? VISTA_CUADRADA
      : vistaPara(Math.max(1, raiz.clientWidth), Math.max(1, raiz.clientHeight));
    dpr = opciones.cuadrada ? 1 : Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vista.w * dpr);
    canvas.height = Math.round(vista.h * dpr);
    canvas.style.width = `${vista.w}px`;
    canvas.style.height = `${vista.h}px`;
  };

  const seek = (entrada: number) => {
    const t = envolver(entrada);
    ultimo = t;
    const f = formaEn(t);
    const c = camaraEn(t);
    lienzo.dibujar(t, f, c, vista.escala * dpr);
    const z = c.zoom * vista.escala;
    mundo.style.transform = `translate(${vista.w / 2}px, ${vista.h / 2}px) scale(${z.toFixed(5)}) translate(${(-c.x).toFixed(3)}px, ${(-c.y).toFixed(3)}px)`;
    for (const capa of capas) capa(t, f, c);
    cursor(t, c, vista);
  };

  medir();
  const observador = new ResizeObserver(() => {
    medir();
    seek(ultimo);
  });
  observador.observe(raiz);

  return {
    seek,
    destruir() {
      observador.disconnect();
      lienzo.destruir();
      raiz.remove();
    },
  };
}
