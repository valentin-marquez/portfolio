import { describe, expect, test } from "vitest";
import { coreografia, retardoDeBarra } from "./coreografia-entrada";

describe("coreografia", () => {
  test("las escalas de partida son asimétricas", () => {
    // la caja se despliega mucho más a lo ancho que a lo alto; igualarlas la
    // convierte en un scale() corriente y el carácter desaparece
    for (const pieza of [coreografia.caja, coreografia.barra]) {
      expect(pieza.desdeX).not.toBeCloseTo(pieza.desdeY, 2);
    }
  });

  test("todo entra creciendo, nada encoge", () => {
    for (const pieza of [coreografia.caja, coreografia.barra]) {
      expect(pieza.desdeX).toBeGreaterThan(0);
      expect(pieza.desdeX).toBeLessThan(1);
      expect(pieza.desdeY).toBeGreaterThan(0);
      expect(pieza.desdeY).toBeLessThan(1);
    }
  });

  test("hay sobrepaso: la forma se pasa y vuelve", () => {
    for (const pieza of [coreografia.caja, coreografia.barra]) {
      expect(pieza.sobrepaso).toBeGreaterThan(0);
    }
  });

  test("el escalonado es menor que la duración de cada pieza", () => {
    // si el retardo supera la duración, las barras entran de una en una y se lee
    // como cuatro animaciones sueltas en vez de como una secuencia
    expect(coreografia.escalonado).toBeLessThan(coreografia.barra.duracion);
  });

  test("la secuencia entera cabe dentro de un corte", () => {
    // el recorrido puede cortar en cualquier momento; una entrada que dura más
    // que el tiempo entre cortes no se ve nunca entera
    const ultima = retardoDeBarra(3) + coreografia.barra.duracion;
    expect(Math.max(ultima, coreografia.caja.duracion + coreografia.caja.retardo)).toBeLessThan(
      coreografia.corteMinimo,
    );
  });
});

describe("retardoDeBarra", () => {
  const todas = (parada: number) => [0, 1, 2, 3].map((i) => retardoDeBarra(i, parada));

  test("la primera barra no espera", () => {
    expect(retardoDeBarra(0)).toBe(0);
  });

  test("cada barra espera un escalón más que la anterior", () => {
    expect(retardoDeBarra(2) - retardoDeBarra(1)).toBe(coreografia.escalonado);
  });

  test("el orden de entrada rota con la parada", () => {
    // dos cortes seguidos no pueden reproducir la misma animación: se convierte
    // en un bucle y deja de leerse como una reacción al corte
    expect(todas(0)).not.toEqual(todas(1));
  });

  test("en cualquier parada hay siempre una barra que abre", () => {
    for (const parada of [0, 1, 2, 3, 7]) {
      expect(Math.min(...todas(parada))).toBe(coreografia.barra.retardo);
    }
  });

  test("ninguna parada alarga la secuencia", () => {
    for (const parada of [0, 1, 2, 3, 7]) {
      expect(Math.max(...todas(parada))).toBe(
        coreografia.barra.retardo + (coreografia.barras - 1) * coreografia.escalonado,
      );
    }
  });
});
