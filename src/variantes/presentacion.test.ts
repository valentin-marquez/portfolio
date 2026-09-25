import { describe, expect, it } from "vitest";
import { crearParametros } from "@/prado/parametros";
import { camaraPresentacion, estadoPresentacion, PASOS } from "./presentacion";

const N = PASOS.length;
const base = crearParametros().camara;

describe("la presentación avanza en su lugar", () => {
  it("en cada paso entero se ve solo ese contenido, nítido", () => {
    for (let i = 1; i < N - 1; i++) {
      const e = estadoPresentacion(i);
      e.paneles.forEach((p, j) => {
        if (j === i) {
          expect(p.opacidad).toBe(1);
          expect(p.desenfoque).toBe(0);
        } else expect(p.opacidad).toBe(0);
      });
    }
  });

  it("el prado se ve en la portada y en el cierre, y en ningún paso del medio", () => {
    expect(estadoPresentacion(0).prado.opacidad).toBe(1);
    expect(estadoPresentacion(N - 1).prado.opacidad).toBe(1);
    for (let i = 1; i < N - 1; i++) expect(estadoPresentacion(i).prado.opacidad).toBe(0);
  });

  it("lo que viene emerge de la bruma: entre dos pasos, el siguiente llega desenfocado", () => {
    const mitad = estadoPresentacion(1.5);
    const siguiente = mitad.paneles[2];
    expect(siguiente?.opacidad).toBeGreaterThan(0);
    expect(siguiente?.desenfoque).toBeGreaterThan(0);
  });

  it("nunca hay dos contenidos del medio plenamente visibles a la vez", () => {
    for (let s = 0; s <= N - 1; s += 0.05) {
      const plenos = estadoPresentacion(s).paneles.filter((p) => p.opacidad > 0.95).length;
      expect(plenos).toBeLessThanOrEqual(1);
    }
  });

  it("las transiciones son continuas", () => {
    let anterior = estadoPresentacion(0);
    for (let s = 0.01; s <= N - 1; s += 0.01) {
      const e = estadoPresentacion(s);
      expect(Math.abs(e.prado.opacidad - anterior.prado.opacidad)).toBeLessThan(0.08);
      e.paneles.forEach((p, j) => {
        expect(Math.abs(p.opacidad - (anterior.paneles[j]?.opacidad ?? 0))).toBeLessThan(0.08);
      });
      anterior = e;
    }
  });

  it("fuera de rango se comporta como los extremos", () => {
    expect(estadoPresentacion(-2)).toEqual(estadoPresentacion(0));
    expect(estadoPresentacion(N + 3)).toEqual(estadoPresentacion(N - 1));
  });
});

describe("la cámara de la presentación", () => {
  it("en la portada y en el cierre está en su lugar", () => {
    expect(camaraPresentacion(base, 0)).toEqual(base);
    expect(camaraPresentacion(base, N - 1)).toEqual(base);
  });

  it("al pasar de la portada al contenido, avanza hacia adentro del prado", () => {
    expect(camaraPresentacion(base, 0.8).avance).toBeGreaterThan(4);
  });

  it("al volver al prado en el cierre, llega desde adelante hacia su lugar", () => {
    expect(camaraPresentacion(base, N - 1.5).avance).toBeGreaterThan(
      camaraPresentacion(base, N - 1.1).avance,
    );
  });
});
