import { describe, expect, it } from "vitest";
import {
  ATERRIZAJE,
  actualizarSemillas,
  crearSemillas,
  DESPEGUE,
  type Entorno,
  faseSegun,
  type Semilla,
  semillaCercana,
  zonasLaterales,
} from "./semillas";

function entorno(progreso: number, extra: Partial<Entorno> = {}): Entorno {
  return {
    progreso,
    tiempo: 0,
    dt: 1 / 60,
    viento: 0.2,
    ancho: 1440,
    alto: 900,
    columna: 560,
    origenes: [
      { x: 500, y: 300 },
      { x: 720, y: 280 },
      { x: 940, y: 310 },
    ],
    destinos: [
      { x: 600, y: 700 },
      { x: 800, y: 720 },
    ],
    ...extra,
  };
}

function simular(s: Semilla[], progreso: number, segundos: number, extra: Partial<Entorno> = {}) {
  for (let i = 0; i < segundos * 60; i++)
    actualizarSemillas(s, entorno(progreso, { ...extra, tiempo: i / 60 }));
}

describe("faseSegun", () => {
  it("reposo, vuelo y aterrizaje según el progreso", () => {
    expect(faseSegun(0)).toBe("reposo");
    expect(faseSegun(DESPEGUE + 0.01)).toBe("vuelo");
    expect(faseSegun(ATERRIZAJE + 0.01)).toBe("aterrizaje");
  });
});

describe("zonasLaterales", () => {
  it("en escritorio deja dos márgenes fuera de la columna", () => {
    const z = zonasLaterales(1440, 560);
    expect(z).toHaveLength(2);
    const [izq, der] = z as [[number, number], [number, number]];
    expect(izq[1]).toBeLessThanOrEqual(720 - 280 - 24);
    expect(der[0]).toBeGreaterThanOrEqual(720 + 280 + 24);
  });

  it("en móvil no hay margen útil", () => {
    expect(zonasLaterales(390, 560)).toHaveLength(0);
  });
});

describe("actualizarSemillas", () => {
  it("crea entre 6 y 10 semillas", () => {
    expect(crearSemillas(8, 1)).toHaveLength(8);
  });

  it("en reposo están ocultas sobre su diente de león", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0, 3);
    for (const x of s) expect(x.alfa).toBeLessThan(0.02);
  });

  it("en vuelo nunca quedan visibles detrás del texto", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 20);
    const centro = 720;
    for (const x of s) {
      const detrasDelTexto = Math.abs(x.x - centro) < 280 + 24;
      if (detrasDelTexto) expect(x.alfa).toBeLessThan(0.02);
      else expect(x.alfa).toBeGreaterThan(0.1);
    }
  });

  it("en pantalla angosta se vuelven invisibles durante el vuelo", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 10, { ancho: 390 });
    for (const x of s) expect(x.alfa).toBeLessThan(0.02);
  });

  it("si el progreso salta de 0 a 1 terminan en los destinos, sin valores inválidos", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0, 1);
    simular(s, 1, 30);
    for (const x of s) {
      expect(Number.isFinite(x.x) && Number.isFinite(x.y)).toBe(true);
      const cerca = [
        { x: 600, y: 700 },
        { x: 800, y: 720 },
      ].some((d) => Math.hypot(d.x - x.x, d.y - x.y) < 40);
      expect(cerca).toBe(true);
      expect(x.fase).toBe("aterrizaje");
    }
  });

  it("al volver arriba regresan a reposo y se ocultan (el diente se regenera)", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 10);
    simular(s, 0, 20);
    for (const x of s) {
      expect(x.fase).toBe("reposo");
      expect(x.alfa).toBeLessThan(0.02);
    }
  });
});

describe("semillaCercana", () => {
  it("solo cruza mientras el hero está a la vista", () => {
    let alguna = false;
    for (let t = 0; t < 30; t += 0.1) if (semillaCercana(t, 0.03).activa) alguna = true;
    expect(alguna).toBe(true);
    for (let t = 0; t < 30; t += 0.1) expect(semillaCercana(t, 0.3).activa).toBe(false);
  });
});
