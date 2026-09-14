import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MathUtils, type Mesh, type MeshBasicMaterial, SRGBColorSpace, type Texture } from "three";
import { encuadres } from "@/features/camera-cuts/encuadres";
import { indiceDesdeProgreso, progresoDesdeScroll } from "@/features/camera-cuts/progreso-scroll";
import { ajustesDireccion } from "@/features/direction-panel/ajustes-direccion";
import { cuadroIdle } from "./ciclo-idle";
import { flotacionEn } from "./flotacion";
import { framesPorAncla } from "./frames-sujeto";

const RUTAS = Object.values(framesPorAncla).flat();

/** Tamaño del plano en unidades de mundo. Provisional hasta que llegue el arte final. */
const ANCHO = 1.3;
const ALTO = 1.9;

/** Altura a la que cuelga el sujeto: es el centro de todos los encuadres. */
const ALTURA = 0.42;

function sinMovimiento(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * El sujeto: un plano orientado a cámara con el arte 2D como textura, en vez de
 * una malla 3D sombreada en tiempo real — ver
 * docs/superpowers/specs/2026-09-14-sujeto-2d-frames-design.md.
 *
 * Tiene RELOJ PROPIO: flota y parpadea a su ritmo, indiferente al visitante.
 * El scroll decide en qué ancla está la cámara, y con ello qué juego de dibujos
 * se usa, pero no qué dibujo se ve — una animación idle que solo existe si
 * mueves el ratón no es idle.
 *
 * El dibujo CORTA, nunca funde. Lo que da vida entre corte y corte es la
 * flotación del plano, no una transición entre imágenes.
 */
export function SujetoFlotante() {
  const plano = useRef<Mesh>(null);
  const reloj = useRef(0);

  const cargadas = useTexture(RUTAS);
  const porRuta = useMemo(() => {
    const mapa = new Map<string, Texture>();
    RUTAS.forEach((ruta, i) => {
      const textura = cargadas[i];
      if (!textura) return;
      textura.colorSpace = SRGBColorSpace;
      textura.needsUpdate = true;
      mapa.set(ruta, textura);
    });
    return mapa;
  }, [cargadas]);

  const primera = cargadas[0];
  if (!primera) throw new Error("No se cargó ningún frame del sujeto");

  useFrame((_, delta) => {
    const malla = plano.current;
    if (!malla) return;

    const { sujeto } = ajustesDireccion;
    const quieto = sinMovimiento();
    if (!quieto) reloj.current += delta;

    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    const progreso = progresoDesdeScroll(window.scrollY, recorrido);
    const encuadre = encuadres[indiceDesdeProgreso(progreso, encuadres.length)];
    if (!encuadre) return;

    const frames = framesPorAncla[encuadre.nombre];
    if (!frames || frames.length === 0) return;

    const indice = cuadroIdle(reloj.current, frames.length, sujeto);
    const textura = porRuta.get(frames[indice] ?? "");
    const material = malla.material as MeshBasicMaterial;
    if (textura && material.map !== textura) material.map = textura;

    const f = flotacionEn(reloj.current, sujeto);
    malla.position.y = f.alto;
    malla.scale.setScalar(f.escala);
    // el balanceo va en la malla, no en el Billboard: ese ya lleva puesta la
    // orientación a cámara y escribirle la rotación la pisaría cada fotograma
    malla.rotation.z = MathUtils.degToRad(f.giro);
  });

  return (
    <Billboard lockZ position={[0, ALTURA, 0]}>
      <mesh ref={plano}>
        <planeGeometry args={[ANCHO, ALTO]} />
        {/* recorte duro: el arte ya viene con el borde resuelto, así que con
            alphaTest el plano escribe profundidad como lo hacía la malla */}
        <meshBasicMaterial alphaTest={0.5} map={primera} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

useTexture.preload(RUTAS);
