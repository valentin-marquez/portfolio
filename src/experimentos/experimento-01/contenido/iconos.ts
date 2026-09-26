// Íconos propios en una grilla de 24. Los de línea comparten el trazo; los de reproducción van
// rellenos, como en iOS. Play y pausa son dos cuadriláteros cada uno para poder interpolarlos.
import { en } from "../util";

/** grosor de línea en px de diseño, sin importar el tamaño del ícono */
export const TRAZO = 1.75;

export const ICONOS = {
  anterior: "M6 5.5h2v13H6zM19 5.5v13l-9-6.5z",
  siguiente: "M16 5.5h2v13h-2zM5 5.5v13l9-6.5z",
  parlante: "M4.5 9.5h3l4.5-4v13l-4.5-4h-3z",
  onda1: "M15.5 9.5a3.5 3.5 0 0 1 0 5",
  onda2: "M18 7a7 7 0 0 1 0 10",
  lupa: "M10.5 16.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM15 15l4.5 4.5",
  check: "M6.5 12.5l3.5 3.5 7.5-8",
  mas: "M12 5v14M5 12h14",
  exportar: "M12 14.5V4.5M8 8.5l4-4 4 4M5 13.5v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4",
  codigo: "M9 8l-4 4 4 4M15 8l4 4-4 4",
  cuadro: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM8 5v14M16 5v14",
  circulo: "M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 1 1 0-17",
} as const;

export type NombreIcono = keyof typeof ICONOS;

type Vertice = readonly [number, number];
type Cuad = readonly [Vertice, Vertice, Vertice, Vertice];

const PAUSA: readonly Cuad[] = [
  [
    [6.5, 5],
    [10, 5],
    [10, 19],
    [6.5, 19],
  ],
  [
    [14, 5],
    [17.5, 5],
    [17.5, 19],
    [14, 19],
  ],
];
const PLAY: readonly Cuad[] = [
  [
    [7, 4.5],
    [13, 8.25],
    [13, 15.75],
    [7, 19.5],
  ],
  [
    [13, 8.25],
    [19, 12],
    [19, 12],
    [13, 15.75],
  ],
];

/** m = 1: pausa (está sonando); m = 0: play */
export function playPausa(m: number): string {
  return PAUSA.map((cuad, k) => {
    const destino = en(PLAY, k);
    const puntos = cuad.map(([x, y], i) => {
      const [px, py] = en(destino, i);
      return `${(px + (x - px) * m).toFixed(3)} ${(py + (y - py) * m).toFixed(3)}`;
    });
    return `M${puntos.join("L")}Z`;
  }).join("");
}
