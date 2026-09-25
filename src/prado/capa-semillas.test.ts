import { describe, expect, it } from "vitest";
import {
  ATRIBUTOS_CAPA,
  FLOTANTES_POR_SEMILLA,
  hayQueDibujar,
  instanciasSemillas,
} from "./capa-semillas";
import { crearSemillas, type Semilla } from "./semillas";

function semillasCon(cambios: Partial<Semilla>[]): Semilla[] {
  return crearSemillas(cambios.length, 1).map((s, i) => ({ ...s, x: 100, y: 100, ...cambios[i] }));
}

const inactiva = { activa: false, x: 0, y: 0, alfa: 0 };
const hero = { left: 200, top: 50, width: 1000, height: 560 };

describe("instanciasSemillas", () => {
  it("no dibuja las semillas invisibles", () => {
    const s = semillasCon([
      { alfa: 0, fase: "reposo" },
      { alfa: 0.5, fase: "vuelo" },
    ]);
    expect(instanciasSemillas(s, inactiva, hero, 0, false).length).toBe(FLOTANTES_POR_SEMILLA);
  });

  it("con movimiento reducido no dibuja las que vuelan ni la cercana", () => {
    const s = semillasCon([
      { alfa: 0.5, fase: "vuelo" },
      { alfa: 0.8, fase: "aterrizaje" },
    ]);
    const datos = instanciasSemillas(
      s,
      { activa: true, x: 0.5, y: 0.5, alfa: 0.35 },
      hero,
      0,
      true,
    );
    expect(datos.length).toBe(FLOTANTES_POR_SEMILLA);
  });

  it("la semilla cercana cruza dentro del rect del hero, grande y desenfocada", () => {
    const datos = instanciasSemillas(
      [],
      { activa: true, x: 0.5, y: 0.25, alfa: 0.35 },
      hero,
      0,
      false,
    );
    expect(datos.length).toBe(FLOTANTES_POR_SEMILLA);
    expect(datos[0]).toBe(700);
    expect(datos[1]).toBe(190);
    expect(datos[2]).toBeGreaterThan(30);
    expect(datos[4]).toBe(1);
  });

  it("sin hero montado no hay semilla cercana", () => {
    expect(
      instanciasSemillas([], { activa: true, x: 0.5, y: 0.5, alfa: 0.35 }, null, 0, false).length,
    ).toBe(0);
  });

  it("con movimiento reducido las semillas posadas no se mecen", () => {
    const s = semillasCon([{ alfa: 0.8, fase: "aterrizaje" }]);
    for (const t of [0, 1.3, 2.7])
      expect(instanciasSemillas(s, inactiva, hero, t, true)[5]).toBe(0);
  });

  it("la semilla cercana usa su propio fundido de opacidad", () => {
    const datos = instanciasSemillas(
      [],
      { activa: true, x: 0.5, y: 0.5, alfa: 0.1 },
      hero,
      0,
      false,
    );
    expect(datos[3]).toBeCloseTo(0.1);
  });
});

describe("costo de la capa", () => {
  it("no pide MSAA: es a pantalla completa y dibuja sprites que ya son suaves", () => {
    expect(ATRIBUTOS_CAPA.antialias).toBe(false);
  });

  it("no limpia ni presenta la pantalla cuando no hubo ni hay nada que dibujar", () => {
    expect(hayQueDibujar(0, 0)).toBe(false);
    expect(hayQueDibujar(0, 3)).toBe(true);
    expect(hayQueDibujar(3, 0)).toBe(true);
  });
});
