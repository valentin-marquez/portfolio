import { describe, expect, it } from "vitest";
import { paso, pista, pistaCiclica, R, respuesta, velocidad } from "./resortes";
import { D } from "./tiempo";

describe("resortes", () => {
  it("el paso parte en 0 y llega a 1", () => {
    expect(paso(0, R.firme)).toBe(0);
    expect(paso(-1, R.firme)).toBe(0);
    expect(paso(3, R.firme)).toBeCloseTo(1, 6);
  });

  it("ningún resorte sobreoscila más de 2 %", () => {
    for (const r of Object.values(R)) {
      let max = 0;
      for (let t = 0; t < 3; t += 0.001) max = Math.max(max, paso(t, r));
      expect(max).toBeLessThan(1.02);
    }
  });

  it("es una función pura: el orden de muestreo no cambia nada", () => {
    const ts = [0.3, 0.01, 1.2, 0.3, 0.05];
    const ida = ts.map((t) => paso(t, R.suave));
    const vuelta = [...ts]
      .reverse()
      .map((t) => paso(t, R.suave))
      .reverse();
    expect(ida).toEqual(vuelta);
  });

  it("respeta la velocidad inicial (unidades por segundo)", () => {
    const f = (t: number) => respuesta(t, R.firme, 0, 0, 300);
    expect(velocidad(f, 1e-4, 5e-5)).toBeCloseTo(300, -1);
  });
});

describe("pista", () => {
  it("sin eventos es constante", () => {
    const f = pista(5, []);
    expect(f(0)).toBe(5);
    expect(f(12)).toBe(5);
  });

  it("suma un resorte por cambio", () => {
    const f = pista(0, [
      { t: 1, a: 10, r: R.firme },
      { t: 5, a: 0, r: R.firme },
    ]);
    expect(f(0.99)).toBeCloseTo(0, 9);
    expect(f(4)).toBeCloseTo(10, 4);
    expect(f(9)).toBeCloseTo(0, 4);
  });

  it("cierra el loop en valor y velocidad aunque el último resorte siga en movimiento", () => {
    const f = pista(0, [
      { t: 2, a: 100, r: R.suave },
      { t: D - 0.15, a: 0, r: R.suave },
    ]);
    const e = 1e-5;
    expect(f(D - e)).toBeCloseTo(f(0), 1);
    const izq = (f(D - e) - f(D - 2 * e)) / e;
    const der = (f(e) - f(0)) / e;
    expect(Math.abs(izq - der)).toBeLessThan(0.5);
    expect(Math.abs(izq)).toBeGreaterThan(10); // de verdad seguía moviéndose
  });

  it("falla si el loop no cierra o si un evento cae fuera del ciclo", () => {
    expect(() => pista(0, [{ t: 1, a: 3, r: R.firme }])).toThrow(/loop/);
    expect(() => pista(0, [{ t: D + 1, a: 0, r: R.firme }])).toThrow(/fuera del loop/);
  });

  it("el arrastre manda mientras se sostiene y suelta con su velocidad", () => {
    const valor = (t: number) => 50 * (t - 3);
    const f = pista(0, [{ t0: 3, t1: 4, valor, a: 0, r: R.firme }]);
    expect(f(3.5)).toBeCloseTo(25, 9);
    expect(f(4)).toBeCloseTo(50, 9);
    const izq = (f(4) - f(4 - 1e-5)) / 1e-5;
    const der = (f(4 + 1e-5) - f(4)) / 1e-5;
    expect(Math.abs(izq - der)).toBeLessThan(0.5);
    expect(f(9)).toBeCloseTo(0, 3);
  });

  it("los cambios después de soltar se suman desde el objetivo del arrastre", () => {
    const f = pista(0, [
      { t: 1, a: 5, r: R.firme },
      { t0: 3, t1: 4, valor: (t) => 5 + 10 * (t - 3), a: 15, r: R.firme },
      { t: D - 0.1, a: 0, r: R.firme },
    ]);
    expect(f(10)).toBeCloseTo(15, 3);
    expect(f(D - 1e-6)).toBeCloseTo(f(0), 2);
  });

  it("no acepta cambios dentro de un arrastre", () => {
    expect(() =>
      pista(0, [
        { t0: 3, t1: 4, valor: () => 0, a: 0, r: R.firme },
        { t: 3.5, a: 0, r: R.firme },
      ]),
    ).toThrow(/dentro de un arrastre/);
  });

  it("pistaCiclica toma como inicio el último objetivo del ciclo", () => {
    const f = pistaCiclica([
      { t: 1, a: 3, r: R.firme },
      { t: 6, a: 7, r: R.firme },
    ]);
    expect(f(0.5)).toBeCloseTo(7, 6);
    expect(f(4)).toBeCloseTo(3, 4);
    expect(pistaCiclica([], 2)(10)).toBe(2);
  });
});
