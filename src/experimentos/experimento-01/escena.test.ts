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

describe("teléfono vertical", () => {
  function cajaEnPantalla(e: ReturnType<typeof nueva>, t: number) {
    e.pose(t);
    e.escena.updateMatrixWorld(true);
    e.camara.updateMatrixWorld(); // la cámara no está en la escena: en el navegador la actualiza el renderer
    const caja = new THREE.Box3();
    for (const n of ["piernaD", "piernaI", "torso", "brazoD", "brazoI", "cabeza"]) {
      // solo la caja de cada parte (la flecha y la amapola escondidas también cuentan para Box3)
      const malla = e.escena.getObjectByName(n)?.children[0];
      if (malla) caja.expandByObject(malla, true);
    }
    let minX = Infinity;
    let maxX = -Infinity;
    for (const x of [caja.min.x, caja.max.x])
      for (const y of [caja.min.y, caja.max.y])
        for (const z of [caja.min.z, caja.max.z]) {
          const p = new THREE.Vector3(x, y, z).project(e.camara);
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
        }
    return { minX, maxX };
  }

  it("con aspecto 374 × 769 el gólem entra completo de ancho mientras camina y ofrece la flor", () => {
    const e = nueva();
    e.camara.aspect = 374 / 769;
    e.camara.updateProjectionMatrix();
    for (const t of [6.5, 9, 11]) {
      const { minX, maxX } = cajaEnPantalla(e, t);
      expect(minX, `t=${t}`).toBeGreaterThan(-1);
      expect(maxX, `t=${t}`).toBeLessThan(1);
    }
  });

  it("en pantalla horizontal la cámara no cambia", () => {
    const a = nueva();
    const b = nueva();
    a.camara.aspect = 1.6;
    b.camara.aspect = 1.2;
    a.pose(6.5);
    b.pose(6.5);
    expect(a.camara.position.distanceTo(b.camara.position)).toBeLessThan(1e-9);
  });
});

describe("sombras en teléfonos", () => {
  it("sin sombras proyectadas, el gólem lleva la sombra redonda de Minecraft que lo sigue", () => {
    const e = crearEscena(
      { hierro: tex(), amapola: tex(), flecha: tex(), formulario: tex(), gracias: tex() },
      { sombras: false },
    );
    let proyecta = false;
    e.escena.traverse((o) => {
      if ((o as THREE.DirectionalLight).isDirectionalLight && o.castShadow) proyecta = true;
    });
    expect(proyecta).toBe(false);
    const sombra = e.escena.getObjectByName("sombra");
    e.pose(9.5); // caminando hacia la cámara
    const golem = e.escena.getObjectByName("golem");
    expect(sombra?.visible).toBe(true);
    expect(sombra?.position.z).toBeCloseTo(golem?.position.z ?? Number.NaN, 6);
    e.pose(14.9); // ya no hay gólem
    expect(sombra?.visible).toBe(false);
  });

  it("con sombras proyectadas no hay sombra redonda", () => {
    const e = nueva();
    expect(e.escena.getObjectByName("sombra")).toBeUndefined();
  });
});

describe("precompilado", () => {
  it("las partículas nacen con color por instancia: el shader no se recompila en el primer golpe", () => {
    const e = nueva();
    const particulas = e.escena.getObjectByName("particulas") as THREE.InstancedMesh;
    expect(particulas.instanceColor).not.toBeNull();
  });
});
