import { Billboard, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { NoColorSpace, type ShaderMaterial, type Texture, Vector2 } from "three";
import { encuadres } from "@/features/camera-cuts/encuadres";
import { indiceDesdeProgreso, progresoDesdeScroll } from "@/features/camera-cuts/progreso-scroll";
import { ajustesDireccion } from "@/features/direction-panel/ajustes-direccion";
import { cuadroIdle } from "./ciclo-idle";
import { flujosPorAncla, framesPorAncla } from "./frames-sujeto";
import mezclaFragmento from "./mezcla-frames.frag.glsl?raw";
import mezclaVertice from "./mezcla-frames.vert.glsl?raw";

const RUTAS = [...Object.values(framesPorAncla).flat(), ...Object.values(flujosPorAncla).flat()];

/** Tamaño del plano en unidades de mundo. Provisional hasta que llegue el arte final. */
const ANCHO = 1.3;
const ALTO = 1.9;

const MODO_TRAMA = 1;
const MODO_FLUJO = 2;

function sinMovimiento(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function crearUniforms(inicial: Texture) {
  return {
    uFrameActual: { value: inicial },
    uFrameSiguiente: { value: inicial },
    uFlujo: { value: inicial },
    uMezcla: { value: 0 },
    uEscalaFlujo: { value: ajustesDireccion.sujeto.escalaFlujo },
    uDensidadTrama: { value: ajustesDireccion.sujeto.densidadTrama },
    uAnguloTrama: { value: ajustesDireccion.mundo.angulo },
    uResolucion: { value: new Vector2(1, 1) },
    uModo: { value: ajustesDireccion.sujeto.modo },
  };
}

type Uniforms = ReturnType<typeof crearUniforms>;

/**
 * El sujeto: un plano orientado a cámara con el arte 2D como textura, en vez de
 * una malla 3D sombreada en tiempo real — ver
 * docs/superpowers/specs/2026-09-14-sujeto-2d-frames-design.md.
 *
 * Tiene RELOJ PROPIO: el bucle idle corre a su ritmo, indiferente al visitante.
 * El scroll decide en qué ancla está la cámara, y con ello qué juego de frames
 * se usa, pero no qué frame se ve — una animación idle que solo existe si
 * mueves el ratón no es idle.
 */
export function SujetoFlotante() {
  const material = useRef<ShaderMaterial>(null);
  const reloj = useRef(0);
  const renderizador = useThree((estado) => estado.gl);

  const cargadas = useTexture(RUTAS);
  const porRuta = useMemo(() => {
    const mapa = new Map<string, Texture>();
    RUTAS.forEach((ruta, i) => {
      const textura = cargadas[i];
      if (!textura) return;
      // el shader escribe directo al framebuffer sin conversión de vuelta, así
      // que la textura se pide en crudo
      textura.colorSpace = NoColorSpace;
      textura.needsUpdate = true;
      mapa.set(ruta, textura);
    });
    return mapa;
  }, [cargadas]);

  const primera = cargadas[0];
  if (!primera) throw new Error("No se cargó ningún frame del sujeto");
  const iniciales = useMemo(() => crearUniforms(primera), [primera]);

  useFrame((_, delta) => {
    const u = material.current?.uniforms as Uniforms | undefined;
    if (!u) return;

    const { sujeto, mundo } = ajustesDireccion;
    const quieto = sinMovimiento();
    if (!quieto) reloj.current += delta;

    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    const progreso = progresoDesdeScroll(window.scrollY, recorrido);
    const encuadre = encuadres[indiceDesdeProgreso(progreso, encuadres.length)];
    if (!encuadre) return;

    const frames = framesPorAncla[encuadre.nombre];
    if (!frames || frames.length === 0) return;

    const { indiceActual, indiceSiguiente, transicion } = cuadroIdle(reloj.current, frames.length, {
      retencion: sujeto.retencion,
      gesto: sujeto.gesto,
      transicion: quieto ? 0 : sujeto.transicion,
    });

    const texturaActual = porRuta.get(frames[indiceActual] ?? "");
    const texturaSiguiente = porRuta.get(frames[indiceSiguiente] ?? "");
    if (texturaActual) u.uFrameActual.value = texturaActual;
    if (texturaSiguiente) u.uFrameSiguiente.value = texturaSiguiente;

    const flujo = porRuta.get(flujosPorAncla[encuadre.nombre]?.[indiceActual] ?? "");
    if (flujo) u.uFlujo.value = flujo;

    // sin mapa de desplazamiento el modo de flujo no tiene nada que empujar:
    // cae a la trama, que no necesita ninguno
    u.uModo.value = sujeto.modo === MODO_FLUJO && !flujo ? MODO_TRAMA : sujeto.modo;
    u.uMezcla.value = transicion;
    u.uEscalaFlujo.value = sujeto.escalaFlujo;
    u.uDensidadTrama.value = sujeto.densidadTrama;
    u.uAnguloTrama.value = mundo.angulo;
    renderizador.getDrawingBufferSize(u.uResolucion.value);
  });

  return (
    <Billboard lockZ position={[0, 0.42, 0]}>
      <mesh>
        <planeGeometry args={[ANCHO, ALTO]} />
        <shaderMaterial
          ref={material}
          fragmentShader={mezclaFragmento}
          premultipliedAlpha
          transparent
          uniforms={iniciales}
          vertexShader={mezclaVertice}
        />
      </mesh>
    </Billboard>
  );
}

useTexture.preload(RUTAS);
