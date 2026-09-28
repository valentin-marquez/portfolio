import { describe, expect, it } from "vitest";
import {
  avanzarEnjambre,
  crearEnjambre,
  type Entorno,
  escribirInstancias,
  FLOTANTES_POR_VOLADOR,
  MAX_VOLADORES,
} from "./voladores";

const vista = { x: 0, y: 1.6, z: 0, medioAncho: 0.48 };
const flor = { x: 0.3, y: 0.75, z: -3 };

function entorno(parcial: Partial<Entorno> = {}): Entorno {
  return {
    dt: 1 / 60,
    rafaga: 0,
    sentido: 1,
    flores: [flor],
    puntero: null,
    vista,
    mariposas: 3,
    hojas: 0,
    especies: [0, 1],
    ...parcial,
  };
}

function simular(segundos: number, en: (t: number) => Entorno, semilla = 1) {
  const e = crearEnjambre(semilla);
  for (let t = 0; t < segundos; t += 1 / 60) avanzarEnjambre(e, en(t));
  return e;
}

describe("mariposas", () => {
  it("llegan las que se piden y vuelan dentro del cuadro, sin bajar al pasto", () => {
    const e = crearEnjambre(3);
    for (let t = 0; t < 40; t += 1 / 60) {
      // ráfagas y el puntero paseando, para sacudirlas
      avanzarEnjambre(
        e,
        entorno({ rafaga: t % 11 < 3 ? 0.8 : 0, puntero: { x: Math.sin(t), z: -3 } }),
      );
      for (const m of e.voladores) {
        expect(Number.isFinite(m.x + m.y + m.z + m.rumbo + m.aleteo)).toBe(true);
        expect(m.y).toBeGreaterThanOrEqual(0.34);
      }
    }
    expect(e.voladores.filter((m) => m.tipo === 0).length).toBe(3);
  });

  it("tarde o temprano una se posa en la flor", () => {
    const e = crearEnjambre(5);
    let posada = false;
    for (let t = 0; t < 90 && !posada; t += 1 / 60) {
      avanzarEnjambre(e, entorno({ mariposas: 2 }));
      posada = e.voladores.some((m) => m.estado === "posada");
    }
    expect(posada).toBe(true);
    const m = e.voladores.find((o) => o.estado === "posada");
    expect(m?.y).toBeCloseTo(flor.y);
  });

  it("si ya no toca que haya, se van por los costados", () => {
    const e = simular(20, (t) => entorno({ mariposas: t < 5 ? 3 : 0 }));
    expect(e.voladores.length).toBe(0);
  });
});

describe("hojas", () => {
  it("caen, se quedan en el pasto, se apagan y llegan otras", () => {
    const e = crearEnjambre(2);
    let apagadas = 0;
    let antes = 0;
    for (let t = 0; t < 60; t += 1 / 60) {
      avanzarEnjambre(e, entorno({ mariposas: 0, hojas: 5, rafaga: t % 11 < 3 ? 0.7 : 0 }));
      const ahora = e.voladores.length;
      if (ahora < antes) apagadas += antes - ahora;
      antes = ahora;
      for (const h of e.voladores) expect(h.y).toBeGreaterThan(-0.5);
    }
    expect(apagadas).toBeGreaterThan(3);
    expect(e.voladores.length).toBeGreaterThan(0);
    expect(e.voladores.length).toBeLessThanOrEqual(MAX_VOLADORES);
  });
});

describe("instancias", () => {
  it("escribe doce números por volador", () => {
    const e = simular(3, () => entorno());
    const datos = new Float32Array(MAX_VOLADORES * FLOTANTES_POR_VOLADOR);
    const n = escribirInstancias(e, datos);
    expect(n).toBe(e.voladores.length);
    expect(datos[0]).toBe(Math.fround(e.voladores[0]?.x ?? Number.NaN));
  });
});
