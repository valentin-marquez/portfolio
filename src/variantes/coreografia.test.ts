import { describe, expect, it } from "vitest";
import { crearParametros } from "@/prado/parametros";
import {
  camaraCierre,
  camaraHero,
  heroQueSeQueda,
  MOVIMIENTOS,
  zonaDescubierta,
} from "./coreografia";

const base = crearParametros().camara;

describe("variante 1: el prado se queda", () => {
  it("al inicio todo está a la vista", () => {
    for (const m of MOVIMIENTOS) {
      const h = heroQueSeQueda(0, m);
      expect(h.titulo.opacidad).toBe(1);
      expect(h.prado.opacidad).toBe(1);
    }
  });

  it("al terminar la sección el título y el prado ya se fueron", () => {
    for (const m of MOVIMIENTOS) {
      const h = heroQueSeQueda(1, m);
      expect(h.titulo.opacidad).toBe(0);
      expect(h.prado.opacidad).toBe(0);
    }
  });

  it("el título se va antes que el prado", () => {
    for (const m of MOVIMIENTOS) {
      for (let p = 0.05; p < 1; p += 0.05) {
        const h = heroQueSeQueda(p, m);
        expect(h.titulo.opacidad).toBeLessThanOrEqual(h.prado.opacidad);
      }
    }
  });

  it("al mirar al cielo el prado sigue entero casi todo el tramo: el cielo es la página", () => {
    expect(heroQueSeQueda(0.7, "cielo").prado.opacidad).toBe(1);
  });

  it("fuera de rango se comporta como los extremos", () => {
    expect(heroQueSeQueda(-3, "sube")).toEqual(heroQueSeQueda(0, "sube"));
    expect(heroQueSeQueda(7, "sube")).toEqual(heroQueSeQueda(1, "sube"));
  });
});

describe("movimientos de cámara", () => {
  it("todos parten de la cámara base: el hero arranca quieto", () => {
    for (const m of MOVIMIENTOS) expect(camaraHero(base, 0, m)).toEqual(base);
  });

  it("cielo: levanta la vista por sobre el horizonte", () => {
    const final = camaraHero(base, 1, "cielo");
    // el punto mirado queda arriba del ojo: se mira hacia arriba
    expect(final.mirarY).toBeGreaterThan(final.altura + 2);
  });

  it("sube: la cámara se eleva", () => {
    expect(camaraHero(base, 1, "sube").altura).toBeGreaterThan(base.altura + 0.5);
  });

  it("avanza: la cámara camina hacia adentro del prado", () => {
    expect(camaraHero(base, 1, "avanza").avance).toBeGreaterThan(5);
  });

  it("los movimientos son continuos y sin retrocesos", () => {
    for (const m of MOVIMIENTOS) {
      let anterior = camaraHero(base, 0, m);
      for (let p = 0.02; p <= 1; p += 0.02) {
        const c = camaraHero(base, p, m);
        const salto =
          Math.abs(c.mirarY - anterior.mirarY) +
          Math.abs(c.altura - anterior.altura) +
          Math.abs(c.avance - anterior.avance);
        expect(salto).toBeLessThan(0.6);
        anterior = c;
      }
    }
  });

  it("en el cierre se vuelve a la vista base: se baja la mirada al prado", () => {
    for (const m of MOVIMIENTOS) {
      expect(camaraCierre(base, 1, m)).toEqual(base);
      expect(camaraCierre(base, 0, m)).toEqual(camaraHero(base, 1, m));
    }
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
