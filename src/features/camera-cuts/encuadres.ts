import type { NombreColor } from "@/shared/paleta";

/**
 * Las paradas del recorrido.
 *
 * Se definen sobre ANCLAS CON NOMBRE y no sobre coordenadas sueltas (§4.5 del
 * diseño): el día que cambie el sujeto se reajustan cuatro anclas en vez de
 * reescribir la animación.
 *
 * El scroll no mueve la cámara por una curva continua: avanza un índice, y entre
 * parada y parada hay un golpe (§2.2). Cada una es una composición cerrada con su
 * propia inclinación y su propio color de fondo, que cortan en el mismo fotograma.
 */

export type Encuadre = {
  nombre: string;
  posicion: readonly [number, number, number];
  mirarA: readonly [number, number, number];
  /** Ángulo holandés en grados. Nunca 0: nada se alinea al eje. */
  inclinacion: number;
  fondo: NombreColor;
};

export const encuadres: readonly Encuadre[] = [
  {
    nombre: "lejos",
    posicion: [-1.6, 0.75, 3.4],
    mirarA: [0, 0.42, 0],
    inclinacion: -7,
    fondo: "tinta",
  },
  {
    nombre: "cuerpo",
    posicion: [-1.0, 0.5, 2.2],
    mirarA: [0, 0.38, 0],
    inclinacion: 11,
    fondo: "mostaza",
  },
  {
    nombre: "hombro",
    posicion: [-0.62, 0.85, 1.35],
    mirarA: [0.04, 0.72, 0],
    inclinacion: -5,
    fondo: "naranja",
  },
  {
    nombre: "cara",
    posicion: [-0.34, 0.95, 0.8],
    mirarA: [0, 0.9, 0],
    inclinacion: 9,
    fondo: "tinta",
  },
] as const;

export function encuadrePorIndice(indice: number): Encuadre {
  const i = Math.min(Math.max(indice, 0), encuadres.length - 1);
  const encuadre = encuadres[i];
  if (!encuadre) throw new Error(`No hay encuadre en el índice ${i}`);
  return encuadre;
}
