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
    posicion: [-2.6, 0.9, 5.2],
    mirarA: [0, 0.2, 0],
    inclinacion: -7,
    fondo: "tinta",
  },
  {
    nombre: "cuerpo",
    posicion: [-1.7, 0.35, 3.1],
    mirarA: [0, 0.15, 0],
    inclinacion: 11,
    fondo: "mostaza",
  },
  {
    nombre: "hombro",
    posicion: [-0.9, 0.62, 1.7],
    mirarA: [0.05, 0.5, 0],
    inclinacion: -5,
    fondo: "naranja",
  },
  {
    nombre: "cara",
    posicion: [-0.42, 0.78, 0.95],
    mirarA: [0, 0.72, 0],
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
