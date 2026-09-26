import { describe, expect, it } from "vitest";
import rejilla from "./rejilla.json";
import { D, envolver, P, PULSOS, pulso } from "./tiempo";
import { clamp01, en, mezclar } from "./util";

describe("tiempo", () => {
  it("el loop dura lo que miden las muestras del audio", () => {
    expect(D).toBe(rejilla.muestras / rejilla.frecuencia);
    expect(D).toBeGreaterThan(20.08);
    expect(D).toBeLessThan(20.11);
    expect(P * PULSOS).toBeCloseTo(D, 12);
    expect(P).toBeCloseTo(rejilla.pulso, 5);
  });

  it("el pulso 1 es el comienzo y el 33 cierra el loop", () => {
    expect(pulso(1)).toBe(0);
    expect(pulso(33)).toBeCloseTo(D, 12);
    expect(pulso(3.5)).toBeCloseTo(2.5 * P, 12);
  });

  it("envolver lleva cualquier tiempo a [0, D)", () => {
    expect(envolver(D)).toBe(0);
    expect(envolver(-0.1)).toBeCloseTo(D - 0.1, 12);
    expect(envolver(3)).toBe(3);
    expect(envolver(2 * D + 1)).toBeCloseTo(1, 9);
  });
});

describe("util", () => {
  it("clamp01 y mezclar", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(4)).toBe(1);
    expect(mezclar(10, 20, 0.25)).toBe(12.5);
  });

  it("en() devuelve el elemento o falla fuerte", () => {
    expect(en([4, 5], 1)).toBe(5);
    expect(() => en([4, 5], 2)).toThrow(/fuera de rango/);
  });
});
