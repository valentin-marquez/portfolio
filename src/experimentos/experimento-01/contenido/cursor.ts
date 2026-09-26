// La flecha del cursor: su tamaño sigue la escala de la vista, no el zoom de la cámara, y apunta a un
// punto del mundo.
import { aPantalla, type Camara, type Vista } from "../camara";
import { cursorEn } from "../cursor";

const FLECHA = "M0 0L0 22.5L5.6 17.4L9.4 25.6L12.9 24.1L9.2 16.1L16.6 16.1Z";

export function crearCursor(raiz: HTMLElement): (t: number, c: Camara, v: Vista) => void {
  raiz.innerHTML = `<svg width="34" height="48" viewBox="0 0 20 28"><path d="${FLECHA}" fill="#111110" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  return (t, c, v) => {
    const k = cursorEn(t);
    const [x, y] = aPantalla(c, v, k.x, k.y);
    const escala = v.escala * (1 - 0.12 * k.presion);
    raiz.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${escala.toFixed(4)})`;
  };
}
