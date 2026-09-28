import { describe, expect, it } from "vitest";
import {
  type Almacen,
  cargarClimaDelVisitante,
  climaDesdeViento,
  DESPEJADO,
  estacionEn,
  latitudProbable,
  tiempoDesdeMeteo,
} from "./clima";

describe("climaDesdeViento", () => {
  it("con calma, ráfagas espaciadas y suaves", () => {
    const c = climaDesdeViento({ velocidad: 2, rafagas: 4, direccion: 270 });
    expect(c.periodo).toBeGreaterThanOrEqual(15);
    expect(c.fuerza).toBeLessThan(0.65);
  });

  it("con viento fuerte, ráfagas seguidas pero nunca más de una cada 5 s", () => {
    const c = climaDesdeViento({ velocidad: 90, rafagas: 130, direccion: 270 });
    expect(c.periodo).toBeGreaterThanOrEqual(5);
    expect(c.periodo).toBeLessThan(6);
    expect(c.fuerza).toBeLessThanOrEqual(1);
  });

  it("más viento, más seguido", () => {
    const suave = climaDesdeViento({ velocidad: 8, rafagas: 12, direccion: 0 });
    const fuerte = climaDesdeViento({ velocidad: 25, rafagas: 40, direccion: 0 });
    expect(fuerte.periodo).toBeLessThan(suave.periodo);
    expect(fuerte.fuerza).toBeGreaterThan(suave.fuerza);
  });

  it("viento del oeste: la ola entra por la izquierda; del este, por la derecha", () => {
    expect(climaDesdeViento({ velocidad: 10, rafagas: 15, direccion: 270 }).sentido).toBe(1);
    expect(climaDesdeViento({ velocidad: 10, rafagas: 15, direccion: 90 }).sentido).toBe(-1);
  });

  it("datos inválidos dan la brisa por defecto", () => {
    const c = climaDesdeViento({ velocidad: Number.NaN, rafagas: -3, direccion: Number.NaN });
    expect(Number.isFinite(c.periodo)).toBe(true);
    expect(Number.isFinite(c.fuerza)).toBe(true);
    expect([1, -1]).toContain(c.sentido);
  });
});

// --- carga: IP aproximada → viento actual, con caché, tiempo límite y respaldo ---

type Respuesta = { ok: boolean; json(): Promise<unknown> };
const respuesta = (datos: unknown, ok = true): Respuesta => ({ ok, json: async () => datos });
const GEO = { latitude: "-33.4521", longitude: "-70.6536", city: "Santiago" };
const METEO = {
  current: {
    wind_speed_10m: 12.4,
    wind_gusts_10m: 25.1,
    wind_direction_10m: 280,
    weather_code: 63,
    cloud_cover: 100,
    precipitation: 1.2,
  },
};

function almacenEnMemoria(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return { datos, getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => void datos.set(k, v) };
}

function fetchFalso(rutas: { geo?: () => Promise<Respuesta>; meteo?: () => Promise<Respuesta> }) {
  const pedidas: string[] = [];
  const f = async (url: string | URL | Request) => {
    const u = String(url);
    pedidas.push(u);
    if (u.includes("geojs")) return (rutas.geo ?? (async () => respuesta(GEO)))();
    if (u.includes("open-meteo")) return (rutas.meteo ?? (async () => respuesta(METEO)))();
    throw new Error(`url inesperada: ${u}`);
  };
  return { fetch: f as unknown as typeof fetch, pedidas };
}

describe("cargarClimaDelVisitante", () => {
  it("con todo bien, devuelve el clima de la zona del visitante", async () => {
    const f = fetchFalso({});
    const c = await cargarClimaDelVisitante({
      fetch: f.fetch,
      almacen: almacenEnMemoria(),
      ahora: () => 0,
    });
    expect(c?.viento).toEqual(climaDesdeViento({ velocidad: 12.4, rafagas: 25.1, direccion: 280 }));
    expect(c?.tiempo.lluvia).toBe(0.75);
    expect(c?.latitud).toBeCloseTo(-33.45);
  });

  it("sin datos del cielo igual trae el viento, con el día despejado", async () => {
    const soloViento = {
      current: { wind_speed_10m: 5, wind_gusts_10m: 8, wind_direction_10m: 90 },
    };
    const f = fetchFalso({ meteo: async () => respuesta(soloViento) });
    const c = await cargarClimaDelVisitante({ fetch: f.fetch, almacen: null, ahora: () => 0 });
    expect(c?.tiempo).toEqual(DESPEJADO);
  });

  it("al servicio del viento solo le llegan coordenadas redondeadas a ~11 km", async () => {
    const f = fetchFalso({});
    await cargarClimaDelVisitante({ fetch: f.fetch, almacen: null, ahora: () => 0 });
    const meteo = f.pedidas.find((u) => u.includes("open-meteo")) ?? "";
    expect(meteo).toContain("latitude=-33.5");
    expect(meteo).toContain("longitude=-70.7");
    expect(meteo).not.toContain("4521");
  });

  it("si la ubicación falla, no hay clima (queda la brisa por defecto)", async () => {
    const f = fetchFalso({ geo: async () => respuesta({}, false) });
    expect(
      await cargarClimaDelVisitante({ fetch: f.fetch, almacen: null, ahora: () => 0 }),
    ).toBeNull();
  });

  it("si el servicio del viento falla o responde basura, no hay clima", async () => {
    const f1 = fetchFalso({ meteo: async () => respuesta({}, false) });
    expect(
      await cargarClimaDelVisitante({ fetch: f1.fetch, almacen: null, ahora: () => 0 }),
    ).toBeNull();
    const f2 = fetchFalso({ meteo: async () => respuesta({ current: { wind_speed_10m: "x" } }) });
    expect(
      await cargarClimaDelVisitante({ fetch: f2.fetch, almacen: null, ahora: () => 0 }),
    ).toBeNull();
  });

  it("si la red no contesta a tiempo, se rinde y no hay clima", async () => {
    const f = fetchFalso({ geo: () => new Promise(() => {}) });
    const c = await cargarClimaDelVisitante({
      fetch: f.fetch,
      almacen: null,
      ahora: () => 0,
      limiteMs: 20,
    });
    expect(c).toBeNull();
  });

  it("dentro de la misma visita usa lo guardado y no vuelve a consultar", async () => {
    const almacen = almacenEnMemoria();
    const f = fetchFalso({});
    await cargarClimaDelVisitante({ fetch: f.fetch, almacen, ahora: () => 1000 });
    const pedidasAntes = f.pedidas.length;
    const c = await cargarClimaDelVisitante({
      fetch: f.fetch,
      almacen,
      ahora: () => 1000 + 60_000,
    });
    expect(f.pedidas.length).toBe(pedidasAntes);
    expect(c).not.toBeNull();
  });

  it("lo guardado vence a los 30 minutos", async () => {
    const almacen = almacenEnMemoria();
    const f = fetchFalso({});
    await cargarClimaDelVisitante({ fetch: f.fetch, almacen, ahora: () => 0 });
    const pedidasAntes = f.pedidas.length;
    await cargarClimaDelVisitante({ fetch: f.fetch, almacen, ahora: () => 31 * 60_000 });
    expect(f.pedidas.length).toBeGreaterThan(pedidasAntes);
  });

  it("si el almacenamiento lanza (modo privado), igual funciona", async () => {
    const lanza: Almacen = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    };
    const f = fetchFalso({});
    expect(
      await cargarClimaDelVisitante({ fetch: f.fetch, almacen: lanza, ahora: () => 0 }),
    ).not.toBeNull();
  });
});

describe("tiempoDesdeMeteo", () => {
  it("despejado con poca nubosidad", () => {
    const t = tiempoDesdeMeteo({ codigo: 0, nubosidad: 8 });
    expect(t.nubes).toBeCloseTo(0.08);
    expect(t.lluvia + t.nieve + t.niebla + t.tormenta).toBe(0);
  });

  it("si llueve o nieva, el cielo está cubierto aunque la nubosidad diga otra cosa", () => {
    expect(tiempoDesdeMeteo({ codigo: 61, nubosidad: 30 }).nubes).toBeGreaterThanOrEqual(0.85);
    expect(tiempoDesdeMeteo({ codigo: 73 }).nieve).toBe(0.7);
  });

  it("tormenta es lluvia fuerte con relámpagos; niebla es niebla", () => {
    const t = tiempoDesdeMeteo({ codigo: 95 });
    expect(t.tormenta).toBe(1);
    expect(t.lluvia).toBeGreaterThan(0.8);
    expect(tiempoDesdeMeteo({ codigo: 45 }).niebla).toBe(1);
  });

  it("un código desconocido o ausente usa la nubosidad, y sin nada queda despejado", () => {
    expect(tiempoDesdeMeteo({ codigo: 12345, nubosidad: 60 }).nubes).toBeCloseTo(0.6);
    expect(tiempoDesdeMeteo({})).toEqual(DESPEJADO);
    expect(tiempoDesdeMeteo({ precipitacion: 2 }).lluvia).toBeCloseTo(0.5);
  });
});

describe("estación", () => {
  it("en septiembre es primavera en Santiago y otoño en Madrid", () => {
    const fecha = new Date(2026, 8, 28);
    expect(estacionEn(fecha, -33.4)).toBe("primavera");
    expect(estacionEn(fecha, 40.4)).toBe("otono");
  });

  it("enero es verano en el sur e invierno en el norte", () => {
    const enero = new Date(2026, 0, 15);
    expect(estacionEn(enero, -33)).toBe("verano");
    expect(estacionEn(enero, 48)).toBe("invierno");
  });

  it("sin ubicación, el horario de verano delata el hemisferio; sin cambio de hora, el sur", () => {
    // Madrid: UTC+1 en enero (−60) y UTC+2 en julio (−120)
    expect(latitudProbable(-60, -120)).toBeGreaterThan(0);
    // Santiago: UTC−3 en enero (180) y UTC−4 en julio (240)
    expect(latitudProbable(180, 240)).toBeLessThan(0);
    expect(latitudProbable(300, 300)).toBeLessThan(0);
  });
});
