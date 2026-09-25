import { describe, expect, it } from "vitest";
import {
  CLIMA_INICIAL,
  cambiarClima,
  crearReloj,
  faseEn,
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

describe("el clima cambia el ritmo del viento sin saltos", () => {
  const ventoso = { periodo: 6, fuerza: 0.9, sentido: -1 as const };

  it("la fase es continua en el instante del cambio", () => {
    const r = crearReloj();
    const t0 = 37.3;
    const antes = faseEn(r, t0 - 1e-6);
    cambiarClima(r, t0, ventoso);
    expect(faseEn(r, t0 + 1e-6)).toBeCloseTo(antes, 5);
  });

  it("después del cambio los ciclos duran el nuevo periodo", () => {
    const r = crearReloj();
    cambiarClima(r, 10, ventoso);
    expect(faseEn(r, 10 + ventoso.periodo) - faseEn(r, 10)).toBeCloseTo(1, 9);
  });

  it("la ráfaga en curso termina como empezó: fuerza y sentido cambian desde el ciclo siguiente", () => {
    const r = crearReloj();
    // un instante en plena ráfaga del ciclo actual
    let t = 0;
    while (rafaga(t, 0, r).fuerza < 0.5) t += 0.05;
    const enCurso = rafaga(t, 0, r);
    cambiarClima(r, t, ventoso);
    const despues = rafaga(t, 0, r);
    expect(despues.fuerza).toBeCloseTo(enCurso.fuerza, 9);
    expect(despues.frente).toBeCloseTo(enCurso.frente, 9);
  });

  it("con viento del este la ola cruza de derecha a izquierda", () => {
    const r = crearReloj();
    cambiarClima(r, 0, { ...CLIMA_INICIAL, sentido: -1 });
    let anterior = Number.POSITIVE_INFINITY;
    let vistos = 0;
    // el ciclo 3 ya usa el clima nuevo
    for (let k = 0; k < 1; k += 0.01) {
      const x = rafaga((3 + k) * PERIODO_RAFAGA, 0, r);
      if (x.fuerza > 0.01) {
        expect(x.frente).toBeLessThanOrEqual(anterior);
        anterior = x.frente;
        vistos++;
      }
    }
    expect(vistos).toBeGreaterThan(10);
  });

  it("la fuerza nunca pasa de 1, ni con el clima más ventoso", () => {
    const r = crearReloj();
    cambiarClima(r, 0, { periodo: 5, fuerza: 1, sentido: 1 });
    for (let t = 0; t < 600; t += 0.1) expect(rafaga(t, 0, r).fuerza).toBeLessThanOrEqual(1);
  });
});
