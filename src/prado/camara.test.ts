import { describe, expect, it } from "vitest";
import { invertir, mirarA, multiplicar, perspectiva, proyectar, rayoASuelo } from "./camara";

const ojo = { x: 0, y: 1.6, z: 0 };
const objetivo = { x: 0, y: 0.9, z: -12 };
const vp = multiplicar(perspectiva(30, 16 / 9, 0.1, 200), mirarA(ojo, objetivo));

describe("cámara", () => {
  it("el punto mirado cae al centro de la pantalla", () => {
    const p = proyectar(vp, objetivo);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(0, 5);
    expect(p.w).toBeGreaterThan(0);
  });

  it("invertir(m)·m es la identidad", () => {
    const inv = invertir(vp);
    expect(inv).not.toBeNull();
    const id = multiplicar(inv as Float32Array, vp);
    for (let i = 0; i < 16; i++) expect(id[i]).toBeCloseTo(i % 5 === 0 ? 1 : 0, 4);
  });

  it("el rayo desde un punto proyectado del suelo vuelve a ese punto", () => {
    const suelo = { x: 1.3, y: 0, z: -7 };
    const p = proyectar(vp, suelo);
    const hit = rayoASuelo(invertir(vp) as Float32Array, p.x, p.y);
    expect(hit).not.toBeNull();
    expect(hit?.x).toBeCloseTo(1.3, 3);
    expect(hit?.z).toBeCloseTo(-7, 3);
  });

  it("un rayo hacia el cielo no toca el suelo", () => {
    expect(rayoASuelo(invertir(vp) as Float32Array, 0, 0.99)).toBeNull();
  });
});
