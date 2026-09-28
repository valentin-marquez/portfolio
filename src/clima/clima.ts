// El tiempo real de la zona del visitante: su viento marca el ritmo del prado y sus nubes, lluvia,
// niebla o nieve lo visten. La ubicación se estima por IP (geojs.io, sin pedir permiso) y solo viajan
// coordenadas redondeadas a ~11 km al servicio del tiempo (Open-Meteo). Nada se escribe en la página.
// Si algo falla o tarda, queda la brisa por defecto y un día despejado.

import type { Clima } from "@/prado/viento";
import { suave } from "@/prado/viento";

export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

const URL_UBICACION = "https://get.geojs.io/v1/ip/geo.json";
const URL_TIEMPO = "https://api.open-meteo.com/v1/forecast";
// la versión va en la clave: lo guardado con otra forma no se lee
const CLAVE = "prado:clima:2";
const VIGENCIA_MS = 30 * 60_000;
const LIMITE_MS = 2500;

/** Viento real (km/h y grados de donde viene) → ritmo, fuerza y sentido de las ráfagas del prado. */
export function climaDesdeViento(viento: {
  velocidad: number;
  rafagas: number;
  direccion: number;
}): Clima {
  const v = Number.isFinite(viento.velocidad) ? Math.max(0, viento.velocidad) : 5;
  const r = Number.isFinite(viento.rafagas) ? Math.max(0, viento.rafagas) : v;
  const d = Number.isFinite(viento.direccion) ? viento.direccion : 270;
  return {
    // calma: una ráfaga cada ~16 s; viento fuerte: cada 5 s, nunca más seguido
    periodo: 16 - 11 * suave(3, 40, v),
    fuerza: 0.55 + 0.45 * suave(3, 25, Math.max(v, r * 0.6)),
    // la dirección dice de dónde viene: del oeste empuja hacia el este (la ola entra por la izquierda)
    sentido: Math.sin((d * Math.PI) / 180) > 0 ? -1 : 1,
  };
}

/** El cielo que ve el prado, cada cosa de 0 a 1. */
export interface Tiempo {
  nubes: number;
  lluvia: number;
  nieve: number;
  niebla: number;
  /** relámpagos lejanos */
  tormenta: number;
}

export const DESPEJADO: Tiempo = { nubes: 0.1, lluvia: 0, nieve: 0, niebla: 0, tormenta: 0 };

// códigos WMO de Open-Meteo → lo que se ve; las nubes se completan con la nubosidad medida
const POR_CODIGO: Record<number, Partial<Tiempo>> = {
  0: { nubes: 0.05 },
  1: { nubes: 0.25 },
  2: { nubes: 0.55 },
  3: { nubes: 0.95 },
  45: { nubes: 0.85, niebla: 1 },
  48: { nubes: 0.85, niebla: 1 },
  51: { lluvia: 0.25, niebla: 0.2 },
  53: { lluvia: 0.35, niebla: 0.2 },
  55: { lluvia: 0.45, niebla: 0.2 },
  56: { lluvia: 0.3, niebla: 0.2 },
  57: { lluvia: 0.45, niebla: 0.2 },
  61: { lluvia: 0.5 },
  63: { lluvia: 0.75 },
  65: { lluvia: 1 },
  66: { lluvia: 0.55 },
  67: { lluvia: 0.9 },
  71: { nieve: 0.4 },
  73: { nieve: 0.7 },
  75: { nieve: 1 },
  77: { nieve: 0.3 },
  80: { lluvia: 0.5 },
  81: { lluvia: 0.75 },
  82: { lluvia: 1 },
  85: { nieve: 0.6 },
  86: { nieve: 1 },
  95: { lluvia: 0.85, tormenta: 1 },
  96: { lluvia: 1, tormenta: 1 },
  99: { lluvia: 1, tormenta: 1 },
};

const fraccion = (v: number) => Math.min(1, Math.max(0, v));

/** Lo que responde Open-Meteo (código WMO, nubosidad en %, precipitación en mm) → el cielo del prado. */
export function tiempoDesdeMeteo(m: {
  codigo?: number;
  nubosidad?: number;
  precipitacion?: number;
}): Tiempo {
  const porCodigo = (m.codigo !== undefined && POR_CODIGO[m.codigo]) || {};
  const t: Tiempo = { ...DESPEJADO, nubes: 0, ...porCodigo };
  if (m.codigo === undefined && m.precipitacion !== undefined && m.precipitacion > 0) {
    t.lluvia = fraccion(m.precipitacion / 4);
  }
  const medida =
    m.nubosidad !== undefined && Number.isFinite(m.nubosidad) ? m.nubosidad / 100 : null;
  t.nubes = fraccion(medida ?? porCodigo.nubes ?? DESPEJADO.nubes);
  // si cae algo del cielo, el cielo está cubierto
  if (t.lluvia > 0 || t.nieve > 0) t.nubes = Math.max(t.nubes, 0.85);
  return t;
}

/** Para ver un tiempo a pedido (?tiempo=lluvia): los nombres que entiende la página. */
export const TIEMPOS: Record<string, Tiempo> = {
  despejado: { ...DESPEJADO, nubes: 0.05 },
  nublado: { ...DESPEJADO, nubes: 0.95 },
  llovizna: { ...DESPEJADO, nubes: 0.9, lluvia: 0.3, niebla: 0.2 },
  lluvia: { ...DESPEJADO, nubes: 0.95, lluvia: 0.75 },
  tormenta: { ...DESPEJADO, nubes: 1, lluvia: 1, tormenta: 1 },
  niebla: { ...DESPEJADO, nubes: 0.85, niebla: 1 },
  nieve: { ...DESPEJADO, nubes: 0.9, nieve: 0.7 },
};

export type Estacion = "primavera" | "verano" | "otono" | "invierno";
export const ESTACIONES: Estacion[] = ["primavera", "verano", "otono", "invierno"];

/** Estaciones meteorológicas, por mes y hemisferio: en el sur, septiembre ya es primavera. */
export function estacionEn(fecha: Date, latitud: number): Estacion {
  const mes = (fecha.getMonth() + (latitud < 0 ? 6 : 0)) % 12;
  if (mes <= 1 || mes === 11) return "invierno";
  if (mes <= 4) return "primavera";
  if (mes <= 7) return "verano";
  return "otono";
}

/**
 * Mientras no llega la ubicación, el hemisferio se adivina por el horario de verano del navegador:
 * quien adelanta la hora en julio está en el norte. Sin cambio de hora, se asume el sur (Chile).
 * Recibe los desfases de enero y julio en minutos, como getTimezoneOffset.
 */
export function latitudProbable(desfaseEnero: number, desfaseJulio: number): number {
  return desfaseJulio < desfaseEnero ? 40 : -33;
}

const redondear = (grados: number) => (Math.round(grados * 10) / 10).toFixed(1);

/** Lo que se sabe del visitante: su viento, su cielo y su latitud (para la estación). */
export interface Lectura {
  viento: Clima;
  tiempo: Tiempo;
  latitud: number;
}

function leerGuardado(almacen: Almacen | null, ahora: number): Lectura | null {
  try {
    const crudo = almacen?.getItem(CLAVE);
    if (!crudo) return null;
    const { lectura, guardado } = JSON.parse(crudo) as { lectura: Lectura; guardado: number };
    return ahora - guardado < VIGENCIA_MS ? lectura : null;
  } catch {
    return null;
  }
}

function guardar(almacen: Almacen | null, lectura: Lectura, ahora: number) {
  try {
    almacen?.setItem(CLAVE, JSON.stringify({ lectura, guardado: ahora }));
  } catch {
    // sin almacenamiento se vuelve a consultar en la próxima visita; no es un error
  }
}

const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

async function consultar(pedir: typeof fetch, senal: AbortSignal): Promise<Lectura | null> {
  const rUbicacion = await pedir(URL_UBICACION, { signal: senal });
  if (!rUbicacion.ok) return null;
  const ubicacion = (await rUbicacion.json()) as { latitude?: unknown; longitude?: unknown };
  const lat = Number(ubicacion.latitude);
  const lon = Number(ubicacion.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null;
  }
  const url =
    `${URL_TIEMPO}?latitude=${redondear(lat)}&longitude=${redondear(lon)}` +
    "&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code,cloud_cover,precipitation" +
    "&wind_speed_unit=kmh";
  const rTiempo = await pedir(url, { signal: senal });
  if (!rTiempo.ok) return null;
  const tiempo = (await rTiempo.json()) as { current?: Record<string, unknown> };
  const velocidad = tiempo.current?.wind_speed_10m;
  const rafagas = tiempo.current?.wind_gusts_10m;
  const direccion = tiempo.current?.wind_direction_10m;
  if (
    typeof velocidad !== "number" ||
    typeof rafagas !== "number" ||
    typeof direccion !== "number"
  ) {
    return null;
  }
  return {
    viento: climaDesdeViento({ velocidad, rafagas, direccion }),
    // el cielo es un extra: si no viene, el prado queda despejado con el viento real
    tiempo: tiempoDesdeMeteo({
      codigo: numero(tiempo.current?.weather_code),
      nubosidad: numero(tiempo.current?.cloud_cover),
      precipitacion: numero(tiempo.current?.precipitation),
    }),
    latitud: lat,
  };
}

export async function cargarClimaDelVisitante(dep: {
  fetch: typeof fetch;
  almacen: Almacen | null;
  /** reloj de pared en ms, para la vigencia de lo guardado */
  ahora: () => number;
  limiteMs?: number;
}): Promise<Lectura | null> {
  const guardado = leerGuardado(dep.almacen, dep.ahora());
  if (guardado) return guardado;

  const control = new AbortController();
  const limite = setTimeout(() => control.abort(), dep.limiteMs ?? LIMITE_MS);
  const vencido = new Promise<never>((_, rechazar) => {
    control.signal.addEventListener("abort", () => rechazar(new Error("sin respuesta a tiempo")));
  });
  try {
    const lectura = await Promise.race([consultar(dep.fetch, control.signal), vencido]);
    if (lectura) guardar(dep.almacen, lectura, dep.ahora());
    return lectura;
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
    control.abort();
  }
}
