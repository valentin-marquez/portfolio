import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BackSide,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  NoColorSpace,
  type Object3D,
  ShaderMaterial,
  type Texture,
  Vector3,
} from "three";
import { ajustesDireccion } from "@/features/direction-panel/ajustes-direccion";
import { aVec3, paleta } from "@/shared/paleta";
import celFragmento from "./cel.frag.glsl?raw";
import celVertice from "./cel.vert.glsl?raw";
import contornoFragmento from "./contorno.frag.glsl?raw";
import contornoVertice from "./contorno.vert.glsl?raw";

const MODELO = "/sujeto.glb";

function conMaterial(original: Object3D, material: ShaderMaterial): Object3D {
  const copia = original.clone(true);
  copia.traverse((nodo) => {
    const malla = nodo as Mesh;
    if (malla.isMesh) malla.material = material;
  });
  return copia;
}

export function SujetoFlotante() {
  const grupo = useRef<Group>(null);
  const reloj = useRef(0);
  const { scene } = useGLTF(MODELO);

  const mapa = useMemo(() => {
    let encontrado: Texture | null = null;
    scene.traverse((nodo) => {
      const malla = nodo as Mesh;
      if (!malla.isMesh || encontrado) return;
      encontrado = (malla.material as MeshStandardMaterial).map ?? null;
    });

    if (encontrado) {
      // El cargador marca la textura como sRGB y WebGL la convierte a lineal al
      // muestrear. Este shader escribe directo al framebuffer sin convertir de
      // vuelta, así que saldría oscura y virada. Se pide en crudo, que además es
      // como van los colores de la paleta.
      const t = encontrado as Texture;
      t.colorSpace = NoColorSpace;
      t.needsUpdate = true;
    }
    return encontrado as Texture | null;
  }, [scene]);

  const materialCel = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: celVertice,
        fragmentShader: celFragmento,
        uniforms: {
          uMapa: { value: mapa },
          uBase: { value: new Vector3(...aVec3(paleta.cremaLuz)) },
          uUsarTextura: { value: ajustesDireccion.cel.usarTextura ? 1 : 0 },
          // la luz entra desde la izquierda, en espacio de vista: aquí solo
          // decide dónde cae la banda de sombra, no el color
          uLuz: { value: new Vector3(-0.72, 0.42, 0.55) },
          uCorteLuz: { value: ajustesDireccion.cel.corteLuz },
          uCorteSombra: { value: ajustesDireccion.cel.corteSombra },
          uMedio: { value: ajustesDireccion.cel.medio },
          uSombra: { value: ajustesDireccion.cel.sombra },
        },
      }),
    [mapa],
  );

  const materialContorno = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: contornoVertice,
        fragmentShader: contornoFragmento,
        side: BackSide,
        uniforms: {
          uGrosor: { value: ajustesDireccion.cel.grosorContorno },
          uTinta: { value: new Vector3(...aVec3(paleta.tinta)) },
        },
      }),
    [],
  );

  // Se clona la ESCENA, no se le arranca la geometría a la malla. El nodo del
  // modelo lleva una rotación de 90° en X —la corrección Z-arriba de Blender— y
  // el desplazamiento del centrado; quedarse solo con la geometría tira las dos
  // cosas y el sujeto sale tumbado y descolocado.
  const capaCel = useMemo(() => conMaterial(scene, materialCel), [scene, materialCel]);
  const capaContorno = useMemo(
    () => conMaterial(scene, materialContorno),
    [scene, materialContorno],
  );

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    reloj.current += delta;

    const { cel, sujeto } = ajustesDireccion;

    // el panel mueve el sombreado en caliente: los uniforms se refrescan aquí
    const u = materialCel.uniforms;
    if (u.uUsarTextura) u.uUsarTextura.value = cel.usarTextura ? 1 : 0;
    if (u.uCorteLuz) u.uCorteLuz.value = cel.corteLuz;
    if (u.uCorteSombra) u.uCorteSombra.value = cel.corteSombra;
    if (u.uMedio) u.uMedio.value = cel.medio;
    if (u.uSombra) u.uSombra.value = cel.sombra;
    const c = materialContorno.uniforms;
    if (c.uGrosor) c.uGrosor.value = cel.grosorContorno;

    // reloj propio: gira a su ritmo, indiferente al visitante (§4.3)
    g.rotation.y += delta * sujeto.giro;

    // La deriva secundaria OSCILA, no se integra. Sumar un incremento en X y Z
    // cada fotograma acumula sin límite y el sujeto acaba dando volteretas como
    // un dado; lo que se busca es un balanceo de tres o cuatro grados. Las dos
    // frecuencias son inconmensurables para que el ciclo no se repita nunca.
    g.rotation.x = Math.sin(reloj.current * 0.31) * sujeto.deriva;
    g.rotation.z = Math.sin(reloj.current * 0.23 + 1.7) * sujeto.deriva * 0.78;
  });

  return (
    <group ref={grupo} position={[0, 0.42, 0]} scale={1.05}>
      {/* el contorno primero: cara de atrás, malla inflada a lo largo de sus normales */}
      <primitive object={capaContorno} />
      <primitive object={capaCel} />
    </group>
  );
}

useGLTF.preload(MODELO);
