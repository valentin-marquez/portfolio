import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearGolem, PANELES, rects, TARJETA } from "./golem";

describe("golem", () => {
  it("rects da el mapa UV de Minecraft para la cabeza (8 × 10 × 8 en 0,0)", () => {
    const [izq, der, arriba, abajo, frente, atras] = rects(0, 0, 8, 10, 8);
    expect(frente).toEqual([8, 8, 16, 18]);
    expect(der).toEqual([0, 8, 8, 18]);
    expect(izq).toEqual([16, 8, 24, 18]);
    expect(atras).toEqual([24, 8, 32, 18]);
    expect(arriba).toEqual([8, 0, 16, 8]);
    expect(abajo).toEqual([16, 0, 24, 8]);
  });

  it("la pierna en espejo invierte u y cambia los lados", () => {
    const normal = rects(60, 0, 6, 16, 5);
    const espejo = rects(60, 0, 6, 16, 5, true);
    const [n0 = 0, n1 = 0, n2 = 0, n3 = 0] = normal[1] ?? [];
    const [f0 = 0, f1 = 0, f2 = 0, f3 = 0] = normal[4] ?? [];
    expect(espejo[0]).toEqual([n2, n1, n0, n3]);
    expect(espejo[4]).toEqual([f2, f1, f0, f3]);
  });

  it("los paneles cubren la tarjeta completa sin solaparse", () => {
    const area = PANELES.reduce((s, p) => s + (p.x1 - p.x0) * (p.y1 - p.y0), 0);
    expect(area).toBeCloseTo(TARJETA.ANCHO * TARJETA.ALTO, 6);
    for (const [i, a] of PANELES.entries())
      for (const b of PANELES.slice(i + 1)) {
        const cruzaX = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const cruzaY = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        expect(cruzaX > 1e-9 && cruzaY > 1e-9).toBe(false);
      }
  });

  it("el gólem de pie mide 43 de alto, con los pies en el piso", () => {
    const g = crearGolem({
      hierro: new THREE.Texture(),
      amapola: new THREE.Texture(),
      flecha: new THREE.Texture(),
    });
    g.raiz.updateMatrixWorld(true);
    const caja = new THREE.Box3();
    for (const p of Object.values(g.partes)) caja.expandByObject(p.caja);
    expect(caja.min.y).toBeCloseTo(0, 6);
    expect(caja.max.y).toBeCloseTo(43, 6);
    expect(g.raiz.name).toBe("golem");
  });
});
