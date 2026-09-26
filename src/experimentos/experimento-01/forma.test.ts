import { describe, expect, it } from "vitest";
import { aPantalla, camaraEn, VISTA_CUADRADA, vistaPara } from "./camara";
import { hexARgb } from "./color";
import { cursorEn } from "./cursor";
import { CAJAS, COLOR } from "./disposicion";
import { type Forma, formaEn } from "./forma";
import { ARRASTRE_VOLUMEN, CLICS, HOVER, PROGRESO, TRAMOS } from "./guion";
import { D, LADO, pulso } from "./tiempo";
import { en } from "./util";

const numeros = (f: Forma) => [
  f.cx,
  f.cy,
  f.w,
  f.h,
  f.r,
  ...f.color,
  f.estiramiento,
  f.hundido,
  f.pieza.L,
  f.pieza.R,
  f.pieza.cy,
  f.pieza.alto,
  ...f.pieza.color,
  f.pieza.opacidad,
  f.arte.x,
  f.arte.y,
  f.arte.lado,
  f.arte.radio,
  f.arte.opacidad,
];

/** valor y velocidad a cada lado del corte del loop */
function corte(muestra: (t: number) => number[]) {
  const e = 1e-5;
  const a2 = muestra(D - 2 * e);
  const a1 = muestra(D - e);
  const b0 = muestra(0);
  const b1 = muestra(e);
  return a1.map((v, i) => ({
    salto: Math.abs(v - en(b0, i)),
    izq: (v - en(a2, i)) / e,
    der: (en(b1, i) - en(b0, i)) / e,
  }));
}

describe("el loop cierra en valor y velocidad", () => {
  const revisar = (muestra: (t: number) => number[]) => {
    for (const c of corte(muestra)) {
      expect(c.salto).toBeLessThan(0.05);
      expect(Math.abs(c.izq - c.der)).toBeLessThan(2);
    }
  };
  it("la forma", () => revisar((t) => numeros(formaEn(t))));
  it("la cámara", () =>
    revisar((t) => {
      const c = camaraEn(t);
      return [c.x, c.y, c.zoom];
    }));
  it("el cursor", () =>
    revisar((t) => {
      const k = cursorEn(t);
      return [k.x, k.y, k.presion];
    }));
});

describe("forma", () => {
  it("cada estado llega a su ancho antes del cambio siguiente", () => {
    for (let i = 1; i < TRAMOS.length - 1; i++) {
      const tramo = en(TRAMOS, i);
      const t = en(TRAMOS, i + 1).desde - 0.06;
      expect(formaEn(t).w, tramo.estado).toBeCloseTo(CAJAS[tramo.estado].w, 0);
    }
  });

  it("el volumen se estira pasado el máximo y vuelve", () => {
    expect(formaEn(pulso(13.7)).w).toBeGreaterThan(CAJAS.volumen.w + 20);
    expect(formaEn(pulso(15) - 0.06).estiramiento).toBeLessThan(0.5);
  });

  it("la pieza se estira al encender el interruptor y el cuello nunca pasa de 0,3", () => {
    let maxInterruptor = 0;
    for (let t = pulso(16); t < pulso(16.6); t += 0.005) {
      maxInterruptor = Math.max(maxInterruptor, formaEn(t).pieza.cuello);
    }
    expect(maxInterruptor).toBeGreaterThan(0.05);
    for (let t = 0; t < D; t += 0.01) expect(formaEn(t).pieza.cuello).toBeLessThanOrEqual(0.3);
  });

  it("se pone verde en el check y al encender el interruptor", () => {
    const verde = hexARgb(COLOR.verde);
    for (const t of [pulso(4.9), pulso(16.9)]) {
      for (const [i, c] of formaEn(t).color.entries()) expect(c).toBeCloseTo(en(verde, i), 2);
    }
  });
});

describe("cursor", () => {
  it("está sobre cada clic en el momento del clic", () => {
    for (const c of CLICS) {
      const k = cursorEn(c.t);
      expect(Math.hypot(k.x - c.x, k.y - c.y), `clic en ${c.t}`).toBeLessThan(1);
    }
  });

  it("los arrastres y el hover arrancan sin salto", () => {
    for (const t0 of [PROGRESO.t0, ARRASTRE_VOLUMEN.t0, HOVER.t0]) {
      const a = cursorEn(t0 - 1e-6);
      const b = cursorEn(t0);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.25);
    }
  });
});

describe("cámara y vista", () => {
  it("encuadra el interruptor con su zoom", () => {
    expect(camaraEn(pulso(17) - 0.1).zoom).toBeCloseTo(CAJAS.interruptor.zoom, 1);
  });

  it("en el cuadrado de 1440 la escala es 1", () => {
    expect(VISTA_CUADRADA).toEqual({ w: LADO, h: LADO, escala: 1 });
  });

  it("la vista escala por el lado corto y centra la cámara en el contenedor", () => {
    const c = { x: 10, y: -20, zoom: 3 };
    const tarjeta = vistaPara(272, 204);
    expect(tarjeta.escala).toBeCloseTo(204 / LADO, 12);
    expect(aPantalla(c, tarjeta, 10, -20)).toEqual([136, 102]);
    const [x] = aPantalla(c, tarjeta, 11, -20);
    expect(x - 136).toBeCloseTo(3 * tarjeta.escala, 12);
    const telefono = vistaPara(390, 844);
    expect(telefono.escala).toBeCloseTo(390 / LADO, 12);
    expect(aPantalla(c, telefono, 10, -20)).toEqual([195, 422]);
  });
});
