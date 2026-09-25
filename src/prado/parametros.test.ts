import { describe, expect, it } from "vitest";
import { crearParametros } from "./parametros";

describe("crearParametros", () => {
  it("devuelve objetos independientes (el panel de depuración los muta)", () => {
    const a = crearParametros();
    const b = crearParametros();
    a.pasto.tonoBase.r = 0;
    a.foco.distancia = 99;
    expect(b.pasto.tonoBase.r).not.toBe(0);
    expect(b.foco.distancia).not.toBe(99);
  });

  it("el plano de foco cae dentro del prado", () => {
    const p = crearParametros();
    expect(p.foco.distancia).toBeGreaterThan(p.pasto.zCerca);
    expect(p.foco.distancia).toBeLessThan(p.pasto.zLejos);
  });
});
