import { describe, expect, it } from "vitest";
import { crearAzar } from "@/prado/azar";
import { generarRuidoRosa } from "./ruido-rosa";

const varianza = (x: ArrayLike<number>) => {
  let m = 0;
  for (let i = 0; i < x.length; i++) m += x[i] as number;
  m /= x.length;
  let v = 0;
  for (let i = 0; i < x.length; i++) v += ((x[i] as number) - m) ** 2;
  return v / x.length;
};

describe("generarRuidoRosa", () => {
  const n = 48000;
  const r = generarRuidoRosa(n, crearAzar(3));

  it("queda dentro de [-1, 1] (no satura el audio)", () => {
    for (const v of r) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  it("está centrado en cero", () => {
    let m = 0;
    for (const v of r) m += v;
    expect(Math.abs(m / n)).toBeLessThan(0.1);
  });

  it("tiene más energía grave que el ruido blanco (suena a viento, no a siseo)", () => {
    const diff = new Float32Array(n - 1);
    for (let i = 1; i < n; i++) diff[i - 1] = (r[i] as number) - (r[i - 1] as number);
    // en ruido blanco var(diff)/var(x) ≈ 2; en rosa es mucho menor
    expect(varianza(diff) / varianza(r)).toBeLessThan(1);
  });
});
