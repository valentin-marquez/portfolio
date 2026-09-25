// El viento real de la zona del visitante marca el ritmo del prado. La ubicación se estima por IP
// (geojs.io, sin pedir permiso) y solo viajan coordenadas redondeadas a ~11 km al servicio del
// tiempo (Open-Meteo). Nada se muestra en la página. Si algo falla o tarda, queda la brisa por defecto.

import type { Clima } from "@/prado/viento";
import { suave } from "@/prado/viento";

export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

const URL_UBICACION = "https://get.geojs.io/v1/ip/geo.json";
const URL_TIEMPO = "https://api.open-meteo.com/v1/forecast";
const CLAVE = "prado:clima";
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

const redondear = (grados: number) => (Math.round(grados * 10) / 10).toFixed(1);

function leerGuardado(almacen: Almacen | null, ahora: number): Clima | null {
  try {
    const crudo = almacen?.getItem(CLAVE);
    if (!crudo) return null;
    const { clima, guardado } = JSON.parse(crudo) as { clima: Clima; guardado: number };
    return ahora - guardado < VIGENCIA_MS ? clima : null;
  } catch {
    return null;
  }
}

function guardar(almacen: Almacen | null, clima: Clima, ahora: number) {
  try {
    almacen?.setItem(CLAVE, JSON.stringify({ clima, guardado: ahora }));
  } catch {
    // sin almacenamiento se vuelve a consultar en la próxima visita; no es un error
  }
}

async function consultar(pedir: typeof fetch, senal: AbortSignal): Promise<Clima | null> {
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
    "&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kmh";
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
  return climaDesdeViento({ velocidad, rafagas, direccion });
}

export async function cargarClimaDelVisitante(dep: {
  fetch: typeof fetch;
  almacen: Almacen | null;
  /** reloj de pared en ms, para la vigencia de lo guardado */
  ahora: () => number;
  limiteMs?: number;
}): Promise<Clima | null> {
  const guardado = leerGuardado(dep.almacen, dep.ahora());
  if (guardado) return guardado;

  const control = new AbortController();
  const limite = setTimeout(() => control.abort(), dep.limiteMs ?? LIMITE_MS);
  const vencido = new Promise<never>((_, rechazar) => {
    control.signal.addEventListener("abort", () => rechazar(new Error("sin respuesta a tiempo")));
  });
  try {
    const clima = await Promise.race([consultar(dep.fetch, control.signal), vencido]);
    if (clima) guardar(dep.almacen, clima, dep.ahora());
    return clima;
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
    control.abort();
  }
}
