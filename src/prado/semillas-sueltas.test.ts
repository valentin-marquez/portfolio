import { describe, expect, it } from "vitest";
import { crearAzar } from "./azar";
import {
  actualizarSueltas,
  crearSueltas,
  MAXIMO_SUELTAS,
  soltarSemillas,
} from "./semillas-sueltas";

const promedio = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

describe("semillas sueltas al soplar una flor", () => {
  it("salen desde la cabeza", () => {
    const s = crearSueltas();
    soltarSemillas(s, { x: 500, y: 300 }, 40, 24, crearAzar(1));
    expect(s.lista).toHaveLength(24);
    for (const x of s.lista) expect(Math.hypot(x.x - 500, x.y - 300)).toBeLessThanOrEqual(40);
  });

  it("se las lleva el viento: derivan hacia donde sopla y suben", () => {
    const s = crearSueltas();
    soltarSemillas(s, { x: 500, y: 300 }, 40, 24, crearAzar(1));
    for (let i = 0; i < 90; i++) actualizarSueltas(s, 1 / 60, 0.5, 1);
    expect(promedio(s.lista.map((x) => x.x))).toBeGreaterThan(520);
    expect(promedio(s.lista.map((x) => x.y))).toBeLessThan(300);
  });

  it("con viento del este se van hacia la izquierda", () => {
    const s = crearSueltas();
    soltarSemillas(s, { x: 500, y: 300 }, 40, 24, crearAzar(1));
    for (let i = 0; i < 90; i++) actualizarSueltas(s, 1 / 60, 0.5, -1);
    expect(promedio(s.lista.map((x) => x.x))).toBeLessThan(480);
  });

  it("se desvanecen y desaparecen al terminar su vuelo", () => {
    const s = crearSueltas();
    soltarSemillas(s, { x: 500, y: 300 }, 40, 24, crearAzar(1));
    for (let i = 0; i < 60 * 10; i++) actualizarSueltas(s, 1 / 60, 0.3, 1);
    expect(s.lista).toHaveLength(0);
  });

  it(`nunca hay más de ${MAXIMO_SUELTAS} en el aire`, () => {
    const s = crearSueltas();
    for (let k = 0; k < 20; k++) soltarSemillas(s, { x: 500, y: 300 }, 40, 30, crearAzar(k));
    expect(s.lista.length).toBeLessThanOrEqual(MAXIMO_SUELTAS);
  });
});
