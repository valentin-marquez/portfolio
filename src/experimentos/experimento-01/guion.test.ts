import { describe, expect, it } from "vitest";
import { CAJAS } from "./disposicion";
import {
  ARRASTRE_VOLUMEN,
  CLICS,
  estiramientoVolumen,
  filtros,
  momentos,
  sonidos,
  TRAMOS,
  tiempoCancion,
  ventanasDe,
} from "./guion";
import rejilla from "./rejilla.json";
import { D, P, pulso } from "./tiempo";

describe("guion", () => {
  it("empieza y termina como botón, con los tramos en orden", () => {
    expect(TRAMOS[0]?.estado).toBe("boton");
    expect(TRAMOS.at(-1)?.estado).toBe("boton");
    for (let i = 1; i < TRAMOS.length; i++) {
      expect(TRAMOS[i]?.desde).toBeGreaterThan(TRAMOS[i - 1]?.desde ?? Infinity);
    }
  });

  it("algo pasa en cada uno de los 32 pulsos", () => {
    const ms = momentos();
    for (let n = 1; n <= 32; n++) {
      const hay = ms.some((m) => m >= pulso(n) - 0.02 && m <= pulso(n) + 0.3 * P);
      expect(hay, `pulso ${n}`).toBe(true);
    }
  });

  it("los clics caen en la rejilla", () => {
    for (const c of CLICS) expect(Math.abs(c.t / P - Math.round(c.t / P))).toBeLessThan(1e-9);
  });

  it("los sonidos están ordenados y dentro del loop", () => {
    const s = sonidos();
    expect(s.length).toBeGreaterThan(10);
    for (let i = 1; i < s.length; i++) expect(s[i]?.t).toBeGreaterThanOrEqual(s[i - 1]?.t ?? 0);
    for (const e of s) {
      expect(e.t).toBeGreaterThanOrEqual(0);
      expect(e.t).toBeLessThan(D);
    }
  });

  it("cada estado tiene su ventana de contenido y la del botón cruza el loop", () => {
    for (const estado of Object.keys(CAJAS) as (keyof typeof CAJAS)[]) {
      expect(ventanasDe(estado).length).toBeGreaterThan(0);
    }
    const boton = ventanasDe("boton");
    expect(boton).toHaveLength(1);
    expect(boton[0]?.sale).toBeGreaterThan(D);
  });

  it("el filtro deja «Cada cuadro es código» primero", () => {
    expect(filtros().at(-1)?.visibles).toEqual([false, false, true, true]);
  });

  it("el volumen pasa del máximo con un estiramiento moderado", () => {
    let max = 0;
    for (let t = ARRASTRE_VOLUMEN.t0; t <= ARRASTRE_VOLUMEN.t1; t += 0.001) {
      max = Math.max(max, estiramientoVolumen(t));
    }
    expect(estiramientoVolumen(ARRASTRE_VOLUMEN.t0)).toBe(0);
    expect(max).toBeGreaterThan(25);
    // más no: el cursor se despega de la píldora y la píldora se va hacia un lado
    expect(max).toBeLessThan(32);
  });

  it("el reproductor muestra la canción real, se congela en la pausa y sigue después", () => {
    expect(tiempoCancion(0)).toBeCloseTo(rejilla.t0, 6);
    expect(tiempoCancion(pulso(7.6))).toBeCloseTo(tiempoCancion(pulso(7)), 9);
    expect(tiempoCancion(pulso(8.5)) - tiempoCancion(pulso(8))).toBeCloseTo(0.5 * P, 9);
  });
});
