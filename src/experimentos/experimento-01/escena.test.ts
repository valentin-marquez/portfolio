import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearEscena } from "./escena";
import { FIN, SWAP } from "./tiempo";

const tex = () => new THREE.Texture();
const nueva = () =>
  crearEscena({ hierro: tex(), amapola: tex(), flecha: tex(), formulario: tex(), gracias: tex() });

function enLaTarjeta(e: ReturnType<typeof nueva>) {
  e.tarjeta.updateMatrixWorld(true);
  for (const p of e.paneles) {
    const local = e.tarjeta.worldToLocal(p.g.getWorldPosition(new THREE.Vector3()));
    expect(local.z).toBeCloseTo(0, 3);
    expect(p.g.visible).toBe(true);
  }
}

describe("escena", () => {
  it("en t = 0 los paneles forman la tarjeta y el gólem no se ve", () => {
    const e = nueva();
    e.pose(0);
    enLaTarjeta(e);
    expect(e.escena.getObjectByName("piernaD")?.visible).toBe(false);
    expect(e.escena.getObjectByName("cabeza")?.visible).toBe(false);
  });

  it("al final los paneles vuelven a formar la tarjeta, de frente y sin gólem", () => {
    const e = nueva();
    e.pose(FIN);
    enLaTarjeta(e);
    expect(e.tarjeta.rotation.x).toBeCloseTo(0, 6);
    expect(e.tarjeta.rotation.y).toBeCloseTo(0, 6);
    expect(e.escena.getObjectByName("golem")?.visible).toBe(false);
  });

  it("pose es pura: el mismo t da la misma cámara, venga de donde venga", () => {
    const a = nueva();
    const b = nueva();
    a.pose(3.9);
    b.pose(1.0);
    b.pose(3.9);
    expect(a.camara.position.distanceTo(b.camara.position)).toBeLessThan(1e-9);
  });

  it("el último cuadro vuelve al encuadre del primero", () => {
    const e = nueva();
    e.encuadrar(104, 27.5);
    e.pose(0);
    const inicio = e.camara.position.clone();
    e.pose(FIN);
    // queda un resto del temblor del encaje, invisible (menos de una milésima de unidad)
    expect(e.camara.position.distanceTo(inicio)).toBeLessThan(1e-3);
  });
});

describe("cambio al canvas", () => {
  it("hasta que entra el canvas (SWAP) la cámara no se mueve: la tarjeta 3D calza con la del DOM", () => {
    const e = nueva();
    e.encuadrar(95.8, 27.5);
    e.pose(0);
    const inicio = e.camara.position.clone();
    e.pose(SWAP);
    expect(e.camara.position.distanceTo(inicio)).toBeLessThan(1e-9);
  });
});

describe("fotos", () => {
  it("el frente de los paneles muestra el formulario y, después del poof, el gracias", () => {
    const e = nueva();
    const formulario = tex();
    const gracias = tex();
    e.fijarFotos(formulario, gracias);
    const malla = e.paneles[0]?.g.children[0] as THREE.Mesh;
    const frente = () => (malla.material as THREE.MeshBasicMaterial).map;
    e.pose(1);
    expect(frente()).toBe(formulario);
    e.pose(FIN);
    expect(frente()).toBe(gracias);
  });
});
