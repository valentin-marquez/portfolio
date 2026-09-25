import { crearAzar } from "./azar";
import type { Parametros } from "./parametros";

export const FLOTANTES_POR_HOJA = 8; // x, z, altura, ancho, curva, orientacion, tono, fase

/** Strip de una hoja: pares (v, lado); v va de 0 (raíz) a 1 (punta) y lado es -1 o 1. */
export function mallaHoja(segmentos = 6): Float32Array {
  const m: number[] = [];
  for (let s = 0; s < segmentos; s++) {
    const v = s / segmentos;
    m.push(v, -1, v, 1);
  }
  m.push(1, 0);
  return new Float32Array(m);
}

/**
 * Hojas repartidas por octavas de distancia (z logarítmica): cada tramo de profundidad recibe una
 * cantidad parecida de hojas, y las lejanas se ensanchan para cubrir el suelo sin gastar millones.
 */
export function generarHojas(
  n: number,
  p: Parametros["pasto"],
  fov: number,
  aspecto: number,
  semilla: number,
): Float32Array {
  const azar = crearAzar(semilla);
  const datos = new Float32Array(n * FLOTANTES_POR_HOJA);
  const tanH = Math.tan((fov * Math.PI) / 360) * aspecto;
  for (let i = 0; i < n; i++) {
    const dist = p.zCerca * (p.zLejos / p.zCerca) ** azar();
    const semiancho = dist * tanH * 1.15 + 0.5;
    const escala = 1 + dist * 0.035;
    const o = i * FLOTANTES_POR_HOJA;
    datos[o] = (azar() * 2 - 1) * semiancho;
    datos[o + 1] = -dist;
    datos[o + 2] =
      (p.alturaMin + (p.alturaMax - p.alturaMin) * azar() ** 1.5) * Math.min(escala, 1.6);
    datos[o + 3] = p.ancho * (0.7 + azar() * 0.6) * escala;
    datos[o + 4] = p.curva * (0.4 + azar() * 0.9);
    datos[o + 5] = azar() * Math.PI * 2;
    datos[o + 6] = azar() * 0.999;
    datos[o + 7] = azar();
  }
  return datos;
}

export interface Diente {
  x: number;
  z: number;
  altura: number;
}

export function generarDientes(
  cantidad: number,
  p: Parametros,
  aspecto: number,
  semilla: number,
): Diente[] {
  const azar = crearAzar(semilla ^ 0x9e37);
  const tanH = Math.tan((p.camara.fov * Math.PI) / 360) * aspecto;
  const dientes: Diente[] = [];
  for (let i = 0; i < cantidad; i++) {
    const dist = p.foco.distancia * (0.8 + azar() * 0.4);
    const franja = (i + 0.2 + azar() * 0.6) / cantidad; // repartidos, no amontonados
    dientes.push({
      x: (franja * 2 - 1) * dist * tanH * 0.7,
      z: -dist,
      altura: p.pasto.alturaMax * (1.25 + azar() * 0.3),
    });
  }
  return dientes;
}

/** Los tallos usan el mismo programa que el pasto; tono = 2 los marca como tallo. */
export function instanciasTallos(dientes: Diente[]): Float32Array {
  const datos = new Float32Array(dientes.length * FLOTANTES_POR_HOJA);
  dientes.forEach((d, i) => {
    const o = i * FLOTANTES_POR_HOJA;
    datos.set([d.x, d.z, d.altura, 0.006, 0.12, (i * 2.4) % (Math.PI * 2), 2, (i * 0.37) % 1], o);
  });
  return datos;
}
