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

/** la cantidad de hojas de cada calidad está pensada para una ventana así de ancha */
const ASPECTO_REFERENCIA = 2.2;

/**
 * Cuántas hojas hacen falta para una ventana de este aspecto con la misma densidad: el pasto se
 * genera solo donde la cámara mira, y un teléfono vertical ve un tercio de lo que ve una pantalla ancha.
 */
export function hojasParaAspecto(hojas: number, aspecto: number): number {
  return Math.round(hojas * Math.min(1, Math.max(0.25, aspecto / ASPECTO_REFERENCIA)));
}

/**
 * Hojas repartidas por octavas de distancia (z logarítmica): cada tramo de profundidad recibe una
 * cantidad parecida de hojas, y las lejanas se ensanchan para cubrir el suelo sin gastar millones.
 * Van ordenadas de cerca a lejos: así la GPU descarta lo que queda tapado sin llegar a pintarlo.
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
  const orden = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) =>
      (datos[b * FLOTANTES_POR_HOJA + 1] as number) - (datos[a * FLOTANTES_POR_HOJA + 1] as number),
  );
  const ordenadas = new Float32Array(datos.length);
  orden.forEach((desde, hacia) => {
    ordenadas.set(
      datos.subarray(desde * FLOTANTES_POR_HOJA, (desde + 1) * FLOTANTES_POR_HOJA),
      hacia * FLOTANTES_POR_HOJA,
    );
  });
  return ordenadas;
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

const CURVA_TALLO = 0.12;
const orientacionTallo = (i: number) => (i * 2.4) % (Math.PI * 2);

/** Los tallos usan el mismo programa que el pasto; tono = 2 los marca como tallo. */
export function instanciasTallos(dientes: Diente[]): Float32Array {
  const datos = new Float32Array(dientes.length * FLOTANTES_POR_HOJA);
  dientes.forEach((d, i) => {
    const o = i * FLOTANTES_POR_HOJA;
    datos.set([d.x, d.z, d.altura, 0.005, CURVA_TALLO, orientacionTallo(i), 2, (i * 0.37) % 1], o);
  });
  return datos;
}

/**
 * Dónde queda la cabeza del diente de león i sin viento: el tallo se inclina hacia su orientación,
 * igual que en posicionHoja (hoja.glsl) con v = 1.
 */
export function puntaDiente(d: Diente, i: number): { x: number; y: number; z: number } {
  const a = CURVA_TALLO * 1.1;
  const lado = d.altura * Math.sin(a) * 0.9;
  const o = orientacionTallo(i);
  return { x: d.x + Math.cos(o) * lado, y: d.altura * Math.cos(a), z: d.z + Math.sin(o) * lado };
}
