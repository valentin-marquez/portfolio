import { describe, expect, it } from "vitest";
import {
  crearMedicion,
  NIVELES,
  type Rendimiento,
  reanudar,
  registrarCuadro,
  tocaDibujar,
} from "./ritmo";

const nuevo = (): Rendimiento => ({
  nivel: 0,
  fps: 0,
  resolucion: "",
  hojas: 0,
  cuenta: 0,
  desdeCuenta: 0,
});

/** simula una pantalla de `hz` donde cada cuadro dibujado tarda `costo` ms */
function simular(hz: number, costo: number, segundos: number, r = nuevo()) {
  const m = crearMedicion(0);
  const paso = 1000 / hz;
  let libre = 0;
  let dibujados = 0;
  for (let t = 0; t < segundos * 1000; t += paso) {
    if (t < libre) continue; // la GPU sigue ocupada: este cuadro de la pantalla se pierde
    if (!tocaDibujar(m, t, r)) continue;
    registrarCuadro(m, t, r);
    dibujados++;
    libre = t + costo;
  }
  return { r, fps: dibujados / segundos };
}

describe("ritmo del prado", () => {
  it("en una pantalla de 120 Hz dibuja a 60, y a 60 y 90 Hz dibuja todos los cuadros", () => {
    expect(simular(120, 4, 5).fps).toBeCloseTo(60, 0);
    expect(simular(60, 4, 5).fps).toBeCloseTo(60, 0);
    expect(simular(90, 4, 5).fps).toBeCloseTo(90, 0);
  });

  it("un equipo que alcanza no baja de nivel", () => {
    expect(simular(120, 12, 10).r.nivel).toBe(0);
    expect(simular(90, 10, 10).r.nivel).toBe(0);
  });

  it("uno que no alcanza baja de a un nivel hasta sostener el ritmo, y termina a 30", () => {
    const { r } = simular(120, 40, 30);
    expect(r.nivel).toBe(NIVELES.length - 1);
    expect(NIVELES[r.nivel]?.fps).toBe(30);
  });

  it("los primeros segundos no cuentan: ahí se compilan los shaders", () => {
    expect(simular(60, 40, 2).r.nivel).toBe(0);
  });

  it("una pausa larga no se confunde con lentitud", () => {
    const r = nuevo();
    const m = crearMedicion(0);
    for (let t = 0; t < 3000; t += 16.7) registrarCuadro(m, t, r);
    registrarCuadro(m, 9000, r);
    reanudar(m, 9000);
    for (let t = 9000; t < 12000; t += 16.7) registrarCuadro(m, t, r);
    expect(r.nivel).toBe(0);
  });
});
