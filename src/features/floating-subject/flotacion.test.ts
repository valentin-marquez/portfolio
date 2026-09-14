import { describe, expect, test } from "vitest";
import { type AjusteFlotacion, flotacionEn } from "./flotacion";

const ajuste: AjusteFlotacion = { alto: 0.03, respiracion: 0.015, balanceo: 2 };

describe("flotacionEn", () => {
  test("no se va: media hora después sigue dentro de la amplitud", () => {
    // el fallo clásico es integrar en vez de oscilar, y entonces esto explota
    for (let t = 0; t < 1800; t += 0.37) {
      const f = flotacionEn(t, ajuste);
      expect(Math.abs(f.alto)).toBeLessThanOrEqual(ajuste.alto + 1e-9);
      expect(Math.abs(f.escala - 1)).toBeLessThanOrEqual(ajuste.respiracion + 1e-9);
      expect(Math.abs(f.giro)).toBeLessThanOrEqual(ajuste.balanceo + 1e-9);
    }
  });

  test("recorre toda la amplitud, no se queda en un rincón", () => {
    let maximo = 0;
    for (let t = 0; t < 60; t += 0.05) maximo = Math.max(maximo, flotacionEn(t, ajuste).alto);
    expect(maximo).toBeGreaterThan(ajuste.alto * 0.98);
  });

  test("las tres señales no van sincronizadas", () => {
    // si compartieran frecuencia el sujeto pulsaría a la vez en todo, que es
    // justo lo que delata una animación automática
    const a = flotacionEn(4.2, ajuste);
    const b = flotacionEn(4.2 + Math.PI / 0.63, ajuste);
    expect(a.alto).toBeCloseTo(-b.alto, 6);
    expect(a.giro).not.toBeCloseTo(-b.giro, 2);
  });

  test("con las amplitudes en cero el sujeto queda quieto", () => {
    const f = flotacionEn(9.5, { alto: 0, respiracion: 0, balanceo: 0 });
    expect(f.alto).toBeCloseTo(0, 12);
    expect(f.escala).toBeCloseTo(1, 12);
    expect(f.giro).toBeCloseTo(0, 12);
  });
});
