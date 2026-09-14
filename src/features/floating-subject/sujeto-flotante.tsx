import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { NoColorSpace, type ShaderMaterial, type Texture } from "three";
import { encuadres } from "@/features/camera-cuts/encuadres";
import {
  indiceDesdeProgreso,
  progresoDesdeScroll,
  progresoLocalDesdeGlobal,
} from "@/features/camera-cuts/progreso-scroll";
import { cuadrosPorProgreso } from "./cuadros-por-progreso";
import { framesPorAncla } from "./frames-sujeto";
import mezclaFragmento from "./mezcla-frames.frag.glsl?raw";
import mezclaVertice from "./mezcla-frames.vert.glsl?raw";

const RUTAS_TODOS_LOS_FRAMES = Object.values(framesPorAncla).flat();

/** Tamaño del plano en unidades de mundo. Provisional hasta que llegue el arte final. */
const ANCHO = 1.3;
const ALTO = 1.9;

function crearUniforms(inicial: Texture) {
  return {
    uFrameActual: { value: inicial },
    uFrameSiguiente: { value: inicial },
    uMezcla: { value: 0 },
  };
}

type Uniforms = ReturnType<typeof crearUniforms>;

/**
 * El sujeto: un plano orientado a cámara con el arte 2D de krea.ai como
 * textura, en vez de una malla 3D sombreada en tiempo real — ver
 * docs/superpowers/specs/2026-09-14-sujeto-2d-frames-design.md.
 *
 * El scroll es su único motor de animación: no hay reloj propio, giro ni
 * deriva independiente del visitante. El progreso DENTRO del tramo de la
 * ancla activa decide qué frame de su turnaround se ve.
 */
export function SujetoFlotante() {
  const material = useRef<ShaderMaterial>(null);

  const texturasCargadas = useTexture(RUTAS_TODOS_LOS_FRAMES);
  const texturasPorRuta = useMemo(() => {
    const mapa = new Map<string, Texture>();
    RUTAS_TODOS_LOS_FRAMES.forEach((ruta, i) => {
      const textura = texturasCargadas[i];
      if (!textura) return;
      // el shader escribe directo al framebuffer sin conversión de vuelta,
      // así que la textura se pide en crudo — mismo motivo que el atlas del
      // sujeto anterior
      textura.colorSpace = NoColorSpace;
      textura.needsUpdate = true;
      mapa.set(ruta, textura);
    });
    return mapa;
  }, [texturasCargadas]);

  const primeraTextura = texturasCargadas[0];
  if (!primeraTextura) throw new Error("No se cargó ningún frame del sujeto");
  const iniciales = useMemo(() => crearUniforms(primeraTextura), [primeraTextura]);

  useFrame(() => {
    const u = material.current?.uniforms as Uniforms | undefined;
    if (!u) return;

    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    const progreso = progresoDesdeScroll(window.scrollY, recorrido);
    const indice = indiceDesdeProgreso(progreso, encuadres.length);
    const progresoLocal = progresoLocalDesdeGlobal(progreso, encuadres.length, indice);

    const encuadre = encuadres[indice];
    if (!encuadre) return;
    const frames = framesPorAncla[encuadre.nombre];
    if (!frames || frames.length === 0) return;

    const { indiceActual, indiceSiguiente, mezcla } = cuadrosPorProgreso(
      progresoLocal,
      frames.length,
    );

    const rutaActual = frames[indiceActual];
    const rutaSiguiente = frames[indiceSiguiente];
    const texturaActual = rutaActual ? texturasPorRuta.get(rutaActual) : undefined;
    const texturaSiguiente = rutaSiguiente ? texturasPorRuta.get(rutaSiguiente) : undefined;

    if (texturaActual) u.uFrameActual.value = texturaActual;
    if (texturaSiguiente) u.uFrameSiguiente.value = texturaSiguiente;
    u.uMezcla.value = mezcla;
  });

  return (
    <Billboard position={[0, 0.42, 0]}>
      <mesh>
        <planeGeometry args={[ANCHO, ALTO]} />
        <shaderMaterial
          ref={material}
          fragmentShader={mezclaFragmento}
          vertexShader={mezclaVertice}
          transparent
          uniforms={iniciales}
        />
      </mesh>
    </Billboard>
  );
}

useTexture.preload(RUTAS_TODOS_LOS_FRAMES);
