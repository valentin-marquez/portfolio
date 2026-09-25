// Semillas que se sueltan al soplar una flor: salen de la cabeza, se las lleva el viento, suben un
// poco y se desvanecen. Se dibujan en la misma capa que las semillas del recorrido.
import type { Punto } from "./semillas";

export const MAXIMO_SUELTAS = 120;
const VIDA_MIN = 4;
const VIDA_MAX = 7;

export interface Suelta {
  x: number;
  y: number;
  vx: number;
  vy: number;
  edad: number;
  vida: number;
  tam: number;
  desenfoque: number;
  fase: number;
}

export interface Sueltas {
  lista: Suelta[];
}

export function crearSueltas(): Sueltas {
  return { lista: [] };
}

export function soltarSemillas(
  s: Sueltas,
  cabeza: Punto,
  radio: number,
  n: number,
  azar: () => number,
) {
  for (let i = 0; i < n; i++) {
    const angulo = azar() * Math.PI * 2;
    const distancia = Math.sqrt(azar()) * radio;
    const empuje = 20 + azar() * 50;
    s.lista.push({
      x: cabeza.x + Math.cos(angulo) * distancia,
      y: cabeza.y + Math.sin(angulo) * distancia,
      // salen hacia afuera de la cabeza, un poco hacia arriba
      vx: Math.cos(angulo) * empuje,
      vy: Math.sin(angulo) * empuje - 25,
      edad: 0,
      vida: VIDA_MIN + azar() * (VIDA_MAX - VIDA_MIN),
      // proporcionales a la flor: una cabecita lejana suelta semillas chicas; la flor grande, grandes
      tam: (0.45 + azar() * 0.25) * Math.min(45, Math.max(10, radio)),
      desenfoque: azar() ** 2,
      fase: azar() * Math.PI * 2,
    });
  }
  if (s.lista.length > MAXIMO_SUELTAS) s.lista.splice(0, s.lista.length - MAXIMO_SUELTAS);
}

/**
 * Un paso de vuelo. `viento` es la intensidad 0..1 y `sentido` hacia dónde sopla en pantalla
 * (1 a la derecha, -1 a la izquierda). Las semillas siguen al viento con arrastre y suben despacio.
 */
export function actualizarSueltas(s: Sueltas, dt: number, viento: number, sentido: 1 | -1) {
  const objetivoX = sentido * (40 + 120 * viento);
  const objetivoY = -18;
  const arrastre = 1 - Math.exp(-dt * 1.2);
  for (const x of s.lista) {
    x.edad += dt;
    x.vx += (objetivoX + Math.sin(x.edad * 1.3 + x.fase) * 25 - x.vx) * arrastre;
    x.vy += (objetivoY + Math.cos(x.edad * 1.1 + x.fase) * 15 - x.vy) * arrastre;
    x.x += x.vx * dt;
    x.y += x.vy * dt;
  }
  s.lista = s.lista.filter((x) => x.edad < x.vida);
}

/** Opacidad a lo largo del vuelo: aparecen enseguida y se desvanecen al final. */
export function alfaSuelta(x: Suelta): number {
  const entrada = Math.min(1, x.edad / 0.25);
  const salida = Math.min(1, Math.max(0, (x.vida - x.edad) / 1.5));
  return 0.75 * entrada * salida;
}
