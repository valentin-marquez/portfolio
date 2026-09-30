// El WebGLRenderer de la escena. Lanza si no hay WebGL2 (o si se fuerza con ?sin-webgl): la página
// entonces muestra la tarjeta de gracias sin animación.
import * as THREE from "three";
import type { Escena } from "./escena";

export type Render = { dibujar(t: number): void; precompilar(): void; ajustar(): void };

export function crearRender(
  contenedor: HTMLElement,
  e: Escena,
  destello: HTMLElement,
  forzarFalla = false,
): Render {
  if (forzarFalla) throw new Error("sin WebGL2 (forzado con ?sin-webgl)");
  const render = new THREE.WebGLRenderer({ antialias: true });
  render.setPixelRatio(Math.min(devicePixelRatio, 2));
  render.shadowMap.enabled = true;
  render.shadowMap.type = THREE.PCFShadowMap; // la variante suave ya no existe en r186
  contenedor.append(render.domElement);

  function ajustar() {
    e.camara.aspect = innerWidth / innerHeight;
    e.camara.updateProjectionMatrix();
    render.setSize(innerWidth, innerHeight);
  }
  ajustar();

  return {
    dibujar(t: number) {
      e.pose(t);
      destello.style.opacity = String(e.destello(t));
      render.render(e.escena, e.camara);
    },
    // compila los shaders al cargar: así el primer cuadro del cambio al canvas no se traba
    precompilar() {
      render.compile(e.escena, e.camara);
    },
    ajustar,
  };
}
