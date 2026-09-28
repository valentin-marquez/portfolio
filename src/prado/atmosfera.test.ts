import { describe, expect, it } from "vitest";
import { DESPEJADO, TIEMPOS } from "@/clima/clima";
import {
  aplicarAtmosfera,
  atmosferaDe,
  atmosferaEn,
  copiarParametros,
  destelloEn,
  fijarAtmosfera,
} from "./atmosfera";
import { crearParametros } from "./parametros";

const SIN_NUBES = { ...DESPEJADO, nubes: 0 };

describe("atmósfera", () => {
  it("la primavera despejada es el prado tal como lo dejan los parámetros", () => {
    const base = crearParametros();
    const salida = copiarParametros(base);
    aplicarAtmosfera(base, atmosferaDe(SIN_NUBES, "primavera"), 0, salida);
    expect(salida.pasto.tonoCuerpo).toEqual(base.pasto.tonoCuerpo);
    expect(salida.luz.colorSol).toEqual(base.luz.colorSol);
    expect(salida.bruma.densidad).toBeCloseTo(base.bruma.densidad);
  });

  it("aplicarla cuadro a cuadro sobre la misma salida no acumula nada", () => {
    const base = crearParametros();
    const salida = copiarParametros(base);
    const a = atmosferaDe(TIEMPOS.lluvia ?? DESPEJADO, "otono");
    aplicarAtmosfera(base, a, 0, salida);
    const primera = structuredClone(salida);
    aplicarAtmosfera(base, a, 0, salida);
    expect(salida).toEqual(primera);
  });

  it("con nubes el sol se apaga; con lluvia el pasto se oscurece y el aire se espesa", () => {
    const base = crearParametros();
    const despejado = copiarParametros(base);
    const nublado = copiarParametros(base);
    const lluvia = copiarParametros(base);
    aplicarAtmosfera(base, atmosferaDe(SIN_NUBES, "primavera"), 0, despejado);
    aplicarAtmosfera(base, atmosferaDe(TIEMPOS.nublado ?? DESPEJADO, "primavera"), 0, nublado);
    aplicarAtmosfera(base, atmosferaDe(TIEMPOS.lluvia ?? DESPEJADO, "primavera"), 0, lluvia);
    expect(nublado.luz.colorSol.r).toBeLessThan(despejado.luz.colorSol.r * 0.5);
    expect(lluvia.pasto.tonoCuerpo.g).toBeLessThan(despejado.pasto.tonoCuerpo.g);
    expect(lluvia.bruma.densidad).toBeGreaterThan(despejado.bruma.densidad);
  });

  it("mariposas en primavera y verano secos, hojas en otoño; la lluvia espanta a las mariposas", () => {
    const base = crearParametros();
    const s = copiarParametros(base);
    expect(aplicarAtmosfera(base, atmosferaDe(SIN_NUBES, "primavera"), 0, s).mariposas).toBe(1);
    expect(aplicarAtmosfera(base, atmosferaDe(SIN_NUBES, "otono"), 0, s).hojas).toBe(1);
    expect(aplicarAtmosfera(base, atmosferaDe(SIN_NUBES, "otono"), 0, s).mariposas).toBe(0);
    const lluvia = TIEMPOS.lluvia ?? DESPEJADO;
    expect(aplicarAtmosfera(base, atmosferaDe(lluvia, "verano"), 0, s).mariposas).toBe(0);
    expect(
      aplicarAtmosfera(base, atmosferaDe(SIN_NUBES, "invierno"), 0, s).escarcha,
    ).toBeGreaterThan(0);
  });

  it("la transición parte donde estaba y llega a la nueva en su duración", () => {
    const tr = {
      desde: atmosferaDe(SIN_NUBES, "primavera"),
      hacia: atmosferaDe(SIN_NUBES, "primavera"),
      t0: 0,
      duracion: 0,
    };
    fijarAtmosfera(atmosferaDe(TIEMPOS.lluvia ?? DESPEJADO, "otono"), 10, 4, tr);
    expect(atmosferaEn(10, tr).tiempo.lluvia).toBe(0);
    const medio = atmosferaEn(12, tr);
    expect(medio.tiempo.lluvia).toBeGreaterThan(0.2);
    expect(medio.estacion.otono + medio.estacion.primavera).toBeCloseTo(1);
    expect(atmosferaEn(14, tr).tiempo.lluvia).toBeCloseTo(0.75);
    // un cambio a mitad de camino empalma desde donde iba
    fijarAtmosfera(atmosferaDe(SIN_NUBES, "otono"), 12, 4, tr);
    expect(atmosferaEn(12, tr).tiempo.lluvia).toBeCloseTo(medio.tiempo.lluvia);
  });

  it("los relámpagos son breves y acotados", () => {
    let encendido = 0;
    for (let t = 0; t < 140; t += 0.01) {
      const d = destelloEn(t);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(1.1);
      if (d > 0.1) encendido += 0.01;
    }
    expect(encendido).toBeGreaterThan(0);
    expect(encendido).toBeLessThan(140 * 0.05);
  });
});
