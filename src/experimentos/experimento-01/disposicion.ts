// Dónde va cada cosa, en px de diseño (la cámara los escala). La forma vive centrada en el origen;
// solo la paleta ⌘K se ancla por arriba mientras se filtra.
import { recorrido } from "./recorrido";
import rejilla from "./rejilla.json";
import { en, mezclar } from "./util";

export type Estado =
  | "boton"
  | "cargador"
  | "check"
  | "isla"
  | "reproductor"
  | "volumen"
  | "interruptor"
  | "pestanas"
  | "grafico"
  | "paleta"
  | "toast";

export const COLOR = {
  lienzo: "#efebe1",
  negro: "#111110",
  blanco: "#ffffff",
  verde: "#66794a",
  pista: "#d6d2c6",
  resalte: "#ecebe5",
  tenue: "#8a877d",
  tinta: "#1f1e1b",
  gris: "#6f6c63",
} as const;

export interface Caja {
  w: number;
  h: number;
  r: number;
  color: string;
  /** zoom de cámara con que se encuadra este estado en el cuadrado de 1440 */
  zoom: number;
}

export const CAJAS: Record<Estado, Caja> = {
  boton: { w: 132, h: 44, r: 22, color: COLOR.negro, zoom: 3.6 },
  cargador: { w: 44, h: 44, r: 22, color: COLOR.negro, zoom: 4.4 },
  check: { w: 44, h: 44, r: 22, color: COLOR.verde, zoom: 4.4 },
  isla: { w: 184, h: 40, r: 20, color: COLOR.negro, zoom: 3.7 },
  reproductor: { w: 300, h: 152, r: 28, color: COLOR.negro, zoom: 2.7 },
  volumen: { w: 232, h: 44, r: 22, color: COLOR.negro, zoom: 3.6 },
  interruptor: { w: 64, h: 36, r: 18, color: COLOR.pista, zoom: 5.4 },
  pestanas: { w: 252, h: 40, r: 20, color: COLOR.blanco, zoom: 3.5 },
  grafico: { w: 300, h: 210, r: 28, color: COLOR.blanco, zoom: 2.9 },
  paleta: { w: 320, h: 228, r: 20, color: COLOR.blanco, zoom: 2.7 },
  toast: { w: 208, h: 44, r: 22, color: COLOR.negro, zoom: 3.3 },
};

export const ISLA = {
  arte: { x: -72, y: 0, lado: 24, radio: 7 },
  barras: { x: 58, paso: 6 },
} as const;

export const REPRODUCTOR = {
  arte: { x: -110, y: -36, lado: 56, radio: 12 },
  titulo: { x: -70, y: -48 },
  subtitulo: { x: -70, y: -28 },
  barra: { x0: -126, x1: 126, y: 14 },
  tiempos: { y: 30 },
  controles: { y: 56, separacion: 56 },
  /** dónde empieza el tramo dentro de la canción, y cuánto dura la canción (s) */
  inicio: rejilla.t0,
  duracion: rejilla.duracionCancion,
} as const;

export const VOLUMEN = {
  parlante: { x: -90 },
  barra: { x0: -66, x1: 94 },
  inicial: 0.45,
} as const;

/** resistencia de la goma: cuántos px de estiramiento da cada px de sobre-arrastre (logarítmica) */
export const GOMA = { k: 36 } as const;

export const INTERRUPTOR = { knob: 28, xApagado: -14, xEncendido: 14 } as const;

export const PESTANAS = {
  xs: [-82, 0, 82],
  ancho: 80,
  alto: 32,
  nombres: ["Día", "Semana", "Mes"],
} as const;

export const GRAFICO = {
  pestanas: { y: -80, xs: [-60, 0, 60], ancho: 52, alto: 24, nombres: ["Día", "Semana", "Mes"] },
  numero: { x: -126, y: -46 },
  etiqueta: { x: -126, y: -20 },
  area: { x0: -126, x1: 126, y0: 10, y1: 84 },
  /** visitas diarias, en miles */
  datos: [
    2.1, 2.4, 2.2, 2.9, 3.1, 2.8, 3.4, 3.9, 3.6, 4.2, 4.0, 4.6, 5.1, 4.8, 5.5, 5.2, 6.0, 6.4, 6.1,
    6.9, 7.4, 8.2, 7.8, 8.0,
  ],
  min: 2,
  max: 8.4,
  total: 84320,
} as const;

const pasoX = (GRAFICO.area.x1 - GRAFICO.area.x0) / (GRAFICO.datos.length - 1);
export const xDato = (i: number) => GRAFICO.area.x0 + i * pasoX;
export const yDato = (v: number) =>
  GRAFICO.area.y1 -
  ((v - GRAFICO.min) / (GRAFICO.max - GRAFICO.min)) * (GRAFICO.area.y1 - GRAFICO.area.y0);

/** la curva del gráfico: pasa por cada dato, suave entre ellos (la línea, el punto y el cursor la usan) */
export const yCurva = recorrido(GRAFICO.datos.map((v, i) => [xDato(i), yDato(v)] as const));

/** el valor (en miles) bajo x, interpolado entre datos */
export function valorEnX(x: number): number {
  const k = Math.min(Math.max((x - GRAFICO.area.x0) / pasoX, 0), GRAFICO.datos.length - 1);
  const i = Math.min(Math.floor(k), GRAFICO.datos.length - 2);
  return mezclar(en(GRAFICO.datos, i), en(GRAFICO.datos, i + 1), k - i);
}

export const PALETA = {
  /** borde superior de la paleta: queda fijo mientras la lista se filtra */
  arriba: -114,
  entrada: { y: -84, xIcono: -136, xTexto: -116 },
  divisor: -56,
  filas: { y0: -29, paso: 38, alto: 34, margen: 8, xIcono: -132, xTexto: -112, xAtajo: 138 },
  items: [
    { texto: "Nuevo proyecto", atajo: "⌘N", icono: "mas" },
    { texto: "Exportar video", atajo: "⌘E", icono: "exportar" },
    { texto: "Cada cuadro es código", atajo: "↵", icono: "codigo" },
    { texto: "Cuadros por segundo", atajo: "60", icono: "cuadro" },
  ],
  consulta: "cuadro",
  marcador: "Escribe un comando…",
} as const;

export const altoPaleta = (filas: number) => 76 + PALETA.filas.paso * filas;
export const centroPaleta = (filas: number) => PALETA.arriba + altoPaleta(filas) / 2;

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export const coincide = (texto: string, consulta: string) =>
  normalizar(texto).includes(normalizar(consulta));

/** círculo de 18 px + 8 de aire + ~153 px de texto, centrado en una caja de 208 */
export const TOAST = { check: { x: -80 }, texto: { x: -62 } } as const;
