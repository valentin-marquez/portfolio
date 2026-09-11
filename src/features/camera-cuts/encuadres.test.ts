import { describe, expect, test } from "vitest";
import { encuadrePorIndice, encuadres } from "./encuadres";

const distancia = (a: readonly number[], b: readonly number[]) =>
  Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0), (a[2] ?? 0) - (b[2] ?? 0));

describe("encuadres", () => {
  test("las paradas son las anclas con nombre del diseño", () => {
    expect(encuadres.map((e) => e.nombre)).toEqual(["lejos", "cuerpo", "hombro", "cara"]);
  });

  test("ninguna parada está alineada al eje", () => {
    // "nada alineado al eje" es regla de dirección (§2.2), no un adorno
    for (const e of encuadres) {
      expect(Math.abs(e.inclinacion)).toBeGreaterThanOrEqual(5);
      expect(Math.abs(e.inclinacion)).toBeLessThanOrEqual(12);
    }
  });

  test("la inclinación cambia en cada corte", () => {
    for (let i = 1; i < encuadres.length; i++) {
      expect(encuadres[i]?.inclinacion).not.toBe(encuadres[i - 1]?.inclinacion);
    }
  });

  test("el color de fondo corta en el mismo fotograma que la cámara", () => {
    for (let i = 1; i < encuadres.length; i++) {
      expect(encuadres[i]?.fondo).not.toBe(encuadres[i - 1]?.fondo);
    }
  });

  test("el recorrido se acerca: cada parada está más cerca que la anterior", () => {
    for (let i = 1; i < encuadres.length; i++) {
      const antes = encuadres[i - 1];
      const ahora = encuadres[i];
      if (!antes || !ahora) throw new Error("falta una parada");
      expect(distancia(ahora.posicion, ahora.mirarA)).toBeLessThan(
        distancia(antes.posicion, antes.mirarA),
      );
    }
  });

  test("la luz entra siempre desde la izquierda", () => {
    // la cámara se mueve, pero la clave no cambia de lado: es el eje de la escena
    for (const e of encuadres) {
      expect(e.posicion[0]).toBeLessThanOrEqual(0);
    }
  });
});

describe("encuadrePorIndice", () => {
  test("devuelve la parada pedida", () => {
    expect(encuadrePorIndice(0).nombre).toBe("lejos");
    expect(encuadrePorIndice(3).nombre).toBe("cara");
  });

  test("recorta en vez de reventar con un índice fuera de rango", () => {
    expect(encuadrePorIndice(-2).nombre).toBe("lejos");
    expect(encuadrePorIndice(99).nombre).toBe("cara");
  });
});
