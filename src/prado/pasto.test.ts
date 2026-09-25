import { describe, expect, it } from "vitest";
import { crearParametros } from "./parametros";
import {
  FLOTANTES_POR_HOJA,
  FLOTANTES_POR_MOTA,
  generarDientes,
  generarHojas,
  generarPolen,
  instanciasTallos,
  mallaHoja,
} from "./pasto";

const p = crearParametros();

describe("mallaHoja", () => {
  it("es un strip con 2·segmentos + 1 vértices y termina en punta", () => {
    const m = mallaHoja(6);
    expect(m.length / 2).toBe(13);
    expect(m[m.length - 2]).toBe(1);
    expect(m[m.length - 1]).toBe(0);
  });
});

describe("generarHojas", () => {
  const hojas = generarHojas(5000, p.pasto, 30, 16 / 9, 1);

  it("tiene n instancias de 8 flotantes", () => {
    expect(hojas.length).toBe(5000 * FLOTANTES_POR_HOJA);
  });

  it("todas quedan dentro del prado y con alturas en rango (con el escalado por distancia)", () => {
    for (let i = 0; i < 5000; i++) {
      const o = i * FLOTANTES_POR_HOJA;
      const z = hojas[o + 1] as number;
      expect(z).toBeLessThanOrEqual(-p.pasto.zCerca);
      expect(z).toBeGreaterThanOrEqual(-p.pasto.zLejos);
      expect(hojas[o + 2]).toBeGreaterThanOrEqual(p.pasto.alturaMin);
      expect(hojas[o + 2]).toBeLessThanOrEqual(p.pasto.alturaMax * 1.6);
      expect(hojas[o + 6]).toBeLessThan(1);
    }
  });

  it("reparte por octavas de distancia: cerca y lejos tienen cantidades comparables", () => {
    const medio = Math.sqrt(p.pasto.zCerca * p.pasto.zLejos);
    let cerca = 0;
    for (let i = 0; i < 5000; i++)
      if (-(hojas[i * FLOTANTES_POR_HOJA + 1] as number) < medio) cerca++;
    expect(cerca / 5000).toBeGreaterThan(0.4);
    expect(cerca / 5000).toBeLessThan(0.6);
  });

  it("es determinista con la semilla", () => {
    expect(generarHojas(100, p.pasto, 30, 1.5, 9)).toEqual(generarHojas(100, p.pasto, 30, 1.5, 9));
  });
});

describe("dientes de león", () => {
  it("caen alrededor del plano de foco y generan tallos marcados como tallo", () => {
    const d = generarDientes(5, p, 16 / 9, 3);
    expect(d).toHaveLength(5);
    for (const x of d) {
      expect(-x.z).toBeGreaterThan(p.foco.distancia * 0.75);
      expect(-x.z).toBeLessThan(p.foco.distancia * 1.25);
    }
    const t = instanciasTallos(d);
    expect(t.length).toBe(5 * FLOTANTES_POR_HOJA);
    expect(t[6]).toBe(2);
  });
});

describe("generarPolen", () => {
  it("reparte motas en el aire frente a la cámara, sobre el pasto y sin tocar la lente", () => {
    const n = 300;
    const polen = generarPolen(n, 4);
    expect(polen.length).toBe(n * FLOTANTES_POR_MOTA);
    for (let i = 0; i < n; i++) {
      const o = i * FLOTANTES_POR_MOTA;
      const [x, y, z, fase] = [polen[o], polen[o + 1], polen[o + 2], polen[o + 3]] as [
        number,
        number,
        number,
        number,
      ];
      expect(Math.abs(x)).toBeLessThanOrEqual(7);
      expect(y).toBeGreaterThanOrEqual(0.15);
      expect(y).toBeLessThanOrEqual(2.4);
      expect(z).toBeLessThanOrEqual(-1.5);
      expect(z).toBeGreaterThanOrEqual(-16);
      expect(fase).toBeGreaterThanOrEqual(0);
      expect(fase).toBeLessThan(1);
    }
  });

  it("es determinista con la semilla", () => {
    expect(generarPolen(50, 9)).toEqual(generarPolen(50, 9));
  });
});
