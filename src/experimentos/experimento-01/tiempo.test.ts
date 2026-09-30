import { describe, expect, it } from "vitest";
import {
  caeMuerto,
  FIN,
  PAUSAS,
  TOCA_PISO,
  tiempoPose,
  tiempoReal,
  trauma,
  triangulo,
} from "./tiempo";

// Mth.triangleWave de Minecraft, copiada de su definición
const triangleWave = (x: number, p: number) =>
  (Math.abs((x % p) - p * 0.5) - p * 0.25) / (p * 0.25);

describe("tiempo", () => {
  it("triangulo coincide con Mth.triangleWave", () => {
    for (const x of [0, 1.3, 6.5, 12.9, 13, 40.2])
      expect(triangulo(x, 13)).toBeCloseTo(triangleWave(x, 13), 10);
  });

  it("tiempoPose y tiempoReal son inversas fuera de las pausas", () => {
    for (const p of [0, 1, 2.05, 3, 5, 11, 13, 14.9])
      expect(tiempoPose(tiempoReal(p))).toBeCloseTo(p, 10);
  });

  it("la pose se congela dentro de cada pausa", () => {
    for (const [a, h] of PAUSAS) {
      const inicio = tiempoReal(a);
      expect(tiempoPose(inicio + h * 0.5)).toBeCloseTo(a, 10);
      expect(tiempoPose(inicio + h + 0.01)).toBeGreaterThan(a);
    }
  });

  it("FIN es el final de la pose más todas las pausas", () => {
    expect(FIN).toBeCloseTo(15 + PAUSAS.reduce((s, [, h]) => s + h, 0), 10);
  });

  it("caeMuerto llega a 1 justo en TOCA_PISO y no antes", () => {
    expect(caeMuerto(TOCA_PISO)).toBeCloseTo(1, 6);
    expect(caeMuerto(TOCA_PISO - 0.05)).toBeLessThan(1);
    expect(caeMuerto(0)).toBe(0);
  });

  it("el trauma sube en un golpe y se apaga solo", () => {
    const ignicion = tiempoReal(1.15);
    expect(trauma(ignicion - 0.01)).toBe(0);
    expect(trauma(ignicion + 0.01)).toBeGreaterThan(0.4);
    // antes del siguiente golpe (1,5) ya se apagó a menos de un cuarto
    expect(trauma(ignicion + 0.3)).toBeLessThan(trauma(ignicion + 0.01) * 0.25);
  });
});
