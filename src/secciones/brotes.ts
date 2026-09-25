import { hash } from "@/prado/viento";

export interface Brizna {
  /** base, en px desde el borde izquierdo de la palabra */
  x: number;
  /** px */
  alto: number;
  /** cuánto se corre la punta, en px */
  inclinacion: number;
  /** 0, 1 o 2: los tres verdes del pasto */
  tono: number;
}

/** Pasto que brota bajo una palabra: siempre el mismo para la misma palabra, más denso si es ancha. */
export function brotes(ancho: number, semilla: number): Brizna[] {
  const n = Math.max(5, Math.round(ancho / 6.5));
  const paso = ancho / n;
  return Array.from({ length: n }, (_, i) => {
    const h = (k: number) => hash(semilla * 31.7 + i * 7.3 + k);
    const x = Math.min(ancho, Math.max(0, (i + 0.5 + (h(1) - 0.5) * 0.7) * paso));
    return {
      x,
      alto: 4 + 7 * h(2) ** 1.4,
      inclinacion: (h(3) - 0.5) * 3.2,
      tono: Math.floor(h(4) * 3),
    };
  });
}
