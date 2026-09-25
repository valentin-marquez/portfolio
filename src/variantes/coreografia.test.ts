import { describe, expect, it } from "vitest";
import { crearParametros } from "@/prado/parametros";
import { camaraSegunScroll, heroQueSeQueda, zonaDescubierta } from "./coreografia";

describe("variante 1: el prado se queda", () => {
  it("al inicio todo está a la vista y la cámara en su lugar", () => {
    const h = heroQueSeQueda(0);
    expect(h.titulo.opacidad).toBe(1);
    expect(h.prado.opacidad).toBe(1);
    expect(h.camara.dAltura).toBe(0);
  });

  it("al terminar la sección el título y el prado ya se fueron", () => {
    const h = heroQueSeQueda(1);
    expect(h.titulo.opacidad).toBe(0);
    expect(h.prado.opacidad).toBe(0);
  });

  it("el título se va antes que el prado: el prado es lo último en desaparecer", () => {
    for (let p = 0.05; p < 1; p += 0.05) {
      const h = heroQueSeQueda(p);
      expect(h.titulo.opacidad).toBeLessThanOrEqual(h.prado.opacidad);
    }
  });

  it("la cámara sube de a poco y nunca retrocede", () => {
    let anterior = -1;
    for (let p = 0; p <= 1; p += 0.05) {
      const d = heroQueSeQueda(p).camara.dAltura;
      expect(d).toBeGreaterThanOrEqual(anterior);
      anterior = d;
    }
    const base = crearParametros().camara;
    expect(camaraSegunScroll(base, 1).altura).toBeGreaterThan(base.altura);
    expect(camaraSegunScroll(base, 0)).toEqual(base);
  });

  it("fuera de rango se comporta como los extremos", () => {
    expect(heroQueSeQueda(-3)).toEqual(heroQueSeQueda(0));
    expect(heroQueSeQueda(7)).toEqual(heroQueSeQueda(1));
  });
});

describe("variante 2: una sola pradera detrás", () => {
  const prado = { top: 54, bottom: 700, left: 130, width: 1180, height: 646 };

  it("sin hoja encima, todo el prado está descubierto", () => {
    expect(zonaDescubierta(prado, { top: 1200, bottom: 4000 })).toEqual(prado);
  });

  it("con la hoja tapándolo entero, no queda nada descubierto", () => {
    expect(zonaDescubierta(prado, { top: -500, bottom: 1500 })).toBeNull();
  });

  it("cuando la hoja se va hacia arriba, queda descubierta la parte de abajo", () => {
    const z = zonaDescubierta(prado, { top: -2000, bottom: 300 });
    expect(z?.top).toBe(300);
    expect(z?.bottom).toBe(700);
    expect(z?.height).toBe(400);
  });

  it("cuando la hoja recién sube desde abajo, queda descubierta la parte de arriba", () => {
    const z = zonaDescubierta(prado, { top: 500, bottom: 3000 });
    expect(z?.top).toBe(54);
    expect(z?.bottom).toBe(500);
  });
});
