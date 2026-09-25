import { describe, expect, it } from "vitest";
import {
  influenciaScroll,
  intensidad,
  PERIODO_RAFAGA,
  rafaga,
  TOPE_INFLUENCIA,
  vientoEn,
} from "./viento";

describe("rafaga", () => {
  it("es determinista", () => {
    expect(rafaga(123.4, 3)).toEqual(rafaga(123.4, 3));
  });

  it("la fuerza queda en [0, 1] durante horas", () => {
    for (let t = 0; t < 3 * 3600; t += 0.37) {
      const r = rafaga(t);
      expect(r.fuerza).toBeGreaterThanOrEqual(0);
      expect(r.fuerza).toBeLessThanOrEqual(1);
    }
  });

  it("hay calma buena parte del tiempo: al menos 40 % de muestras sin ráfaga", () => {
    let calma = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) if (rafaga(i * 0.05).fuerza < 0.02) calma++;
    expect(calma / n).toBeGreaterThan(0.4);
  });

  it("el frente avanza de izquierda a derecha dentro de un ciclo", () => {
    const ciclo = 5;
    let anterior = -Infinity;
    let vistos = 0;
    for (let k = 0; k < 1; k += 0.01) {
      const r = rafaga((ciclo + k) * PERIODO_RAFAGA);
      if (r.fuerza > 0.01) {
        expect(r.frente).toBeGreaterThanOrEqual(anterior);
        anterior = r.frente;
        vistos++;
      }
    }
    expect(vistos).toBeGreaterThan(10);
  });
});

describe("vientoEn", () => {
  it("es mayor cerca del frente de la ráfaga que lejos de él", () => {
    let t = 0;
    while (rafaga(t).fuerza < 0.8) t += 0.05;
    const { frente } = rafaga(t);
    expect(Math.abs(vientoEn(frente, t))).toBeGreaterThan(Math.abs(vientoEn(frente + 0.8, t)));
  });
});

describe("intensidad", () => {
  it("queda en [0, 1] aunque la influencia extra sea máxima", () => {
    for (let t = 0; t < 600; t += 0.5) {
      const i = intensidad(t, 0, TOPE_INFLUENCIA);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThanOrEqual(1);
    }
  });
});

describe("influenciaScroll", () => {
  it("nunca supera el tope aunque el scroll sea violento y sostenido", () => {
    let v = 0;
    for (let i = 0; i < 1000; i++) v = influenciaScroll(v, 1e7, 0.05);
    expect(v).toBeLessThanOrEqual(TOPE_INFLUENCIA + 1e-9);
    expect(v).toBeGreaterThan(TOPE_INFLUENCIA * 0.99);
  });

  it("sube despacio: un solo cuadro de scroll fuerte no alcanza la mitad del tope", () => {
    expect(influenciaScroll(0, 1e7, 1 / 60)).toBeLessThan(TOPE_INFLUENCIA * 0.5);
  });

  it("vuelve a cero cuando el scroll se detiene", () => {
    let v = TOPE_INFLUENCIA;
    for (let i = 0; i < 600; i++) v = influenciaScroll(v, 0, 1 / 60);
    expect(v).toBeLessThan(0.001);
  });
});
