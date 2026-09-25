import { describe, expect, it } from "vitest";
import { actualizarRastro, crearRastro, MUESTRAS_RASTRO, uniformeRastro } from "./rastro";

const dt = 1 / 60;

/** mueve el puntero en línea recta por el suelo durante `segundos` */
function mover(
  r: ReturnType<typeof crearRastro>,
  desde: { x: number; z: number },
  velocidad: { x: number; z: number },
  segundos: number,
) {
  let p = { ...desde };
  for (let t = 0; t < segundos; t += dt) {
    p = { x: p.x + velocidad.x * dt, z: p.z + velocidad.z * dt };
    actualizarRastro(r, p, dt);
  }
  return p;
}

const fuerzaTotal = (r: ReturnType<typeof crearRastro>) =>
  r.muestras.reduce((suma, m) => suma + m.fuerza, 0);

describe("rastro del puntero", () => {
  it("al mover, la muestra más nueva empuja en la dirección del movimiento", () => {
    const r = crearRastro();
    mover(r, { x: 0, z: -6 }, { x: 1, z: 0 }, 0.5);
    const ultima = r.muestras.at(-1);
    expect(ultima?.dx).toBeCloseTo(1, 5);
    expect(ultima?.dz).toBeCloseTo(0, 5);
  });

  it("con el cursor quieto no se agregan empujes: el pasto no sigue moviéndose", () => {
    const r = crearRastro();
    const p = mover(r, { x: 0, z: -6 }, { x: 1, z: 0 }, 0.3);
    const cantidad = r.muestras.length;
    for (let t = 0; t < 1; t += dt) actualizarRastro(r, p, dt);
    expect(r.muestras.length).toBeLessThanOrEqual(cantidad);
  });

  it("el pasto vuelve despacio: a los 0,5 s conserva más de la mitad y a los 4 s casi nada", () => {
    const r = crearRastro();
    mover(r, { x: 0, z: -6 }, { x: 1.5, z: 0 }, 0.3);
    const inicial = fuerzaTotal(r);
    for (let t = 0; t < 0.5; t += dt) actualizarRastro(r, null, dt);
    expect(fuerzaTotal(r)).toBeGreaterThan(inicial * 0.5);
    for (let t = 0; t < 3.5; t += dt) actualizarRastro(r, null, dt);
    expect(fuerzaTotal(r)).toBeLessThan(inicial * 0.05);
  });

  it("la fuerza crece con la velocidad pero nunca pasa de 1", () => {
    const lento = crearRastro();
    mover(lento, { x: 0, z: -6 }, { x: 0.3, z: 0 }, 0.5);
    const rapido = crearRastro();
    mover(rapido, { x: 0, z: -6 }, { x: 20, z: 0 }, 0.5);
    const maxLento = Math.max(...lento.muestras.map((m) => m.fuerza));
    const maxRapido = Math.max(...rapido.muestras.map((m) => m.fuerza));
    // 0,3 m/s es un quinto de la velocidad plena (1,5 m/s): el empuje tiene que ser suave
    expect(maxLento).toBeLessThan(0.35);
    expect(maxRapido).toBeGreaterThan(maxLento);
    expect(maxRapido).toBeLessThanOrEqual(1);
  });

  it(`guarda a lo más ${MUESTRAS_RASTRO} muestras`, () => {
    const r = crearRastro();
    mover(r, { x: 0, z: -6 }, { x: 2, z: 1 }, 3);
    expect(r.muestras.length).toBeLessThanOrEqual(MUESTRAS_RASTRO);
  });

  it("el uniforme trae x, z y el empuje ya ponderado, relleno con ceros", () => {
    const r = crearRastro();
    mover(r, { x: 0, z: -6 }, { x: 1, z: 0 }, 0.2);
    const u = uniformeRastro(r);
    expect(u.length).toBe(MUESTRAS_RASTRO * 4);
    const m = r.muestras[0];
    expect(u[0]).toBeCloseTo(m?.x ?? Number.NaN);
    expect(u[1]).toBeCloseTo(m?.z ?? Number.NaN);
    expect(u[2]).toBeCloseTo((m?.dx ?? 0) * (m?.fuerza ?? 0));
    expect(u[u.length - 1]).toBe(0);
  });
});
