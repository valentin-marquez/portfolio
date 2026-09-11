import { ScreenQuad } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type ShaderMaterial, Vector2, Vector3 } from "three";
import { aVec3, paleta } from "@/shared/paleta";
import fragmento from "./mundo-grafico.frag.glsl?raw";
import vertice from "./mundo-grafico.vert.glsl?raw";

/** Los ajustes del mundo gráfico, para que el panel de dirección los toque en vivo. */
export type AjustesMundo = {
  angulo: number;
  densidad: number;
  bandas: boolean;
  semitono: boolean;
  grano: boolean;
  desregistro: boolean;
};

export const ajustesPorDefecto: AjustesMundo = {
  angulo: 22,
  densidad: 34,
  bandas: true,
  semitono: true,
  grano: true,
  desregistro: true,
};

function crearUniforms() {
  return {
    uResolucion: { value: new Vector2(1, 1) },
    uTiempo: { value: 0 },
    uAngulo: { value: ajustesPorDefecto.angulo },
    uDensidad: { value: ajustesPorDefecto.densidad },
    uBandas: { value: 1 },
    uSemitono: { value: 1 },
    uGrano: { value: 1 },
    uDesregistro: { value: 1 },
    // Vector3 con los valores sRGB en crudo, no Color: three convertiría el Color a
    // lineal y este shader escribe directo al framebuffer sin la conversión de vuelta,
    // así que los tonos saldrían apagados y virados.
    uTinta: { value: new Vector3(...aVec3(paleta.tinta)) },
    uCrema: { value: new Vector3(...aVec3(paleta.cremaLuz)) },
    uMostaza: { value: new Vector3(...aVec3(paleta.mostaza)) },
    uNaranja: { value: new Vector3(...aVec3(paleta.naranja)) },
  };
}

type Uniforms = ReturnType<typeof crearUniforms>;

/**
 * El fondo: una capa 2D que NO obedece a la perspectiva.
 *
 * Es el truco central de la dirección (§2.1 del diseño): el sujeto tiene volumen
 * y el mundo es cartel. Por eso esto es un cuadrilátero a pantalla completa con
 * un shader, y no geometría colocada en el espacio.
 */
export function MundoGrafico({ ajustes }: { ajustes: AjustesMundo }) {
  // el shader trabaja en gl_FragCoord, así que necesita el tamaño del framebuffer,
  // no el de píxeles CSS: con dpr 1,75 no son lo mismo y la trama se descoloca
  const renderizador = useThree((estado) => estado.gl);
  const material = useRef<ShaderMaterial>(null);
  const iniciales = useMemo(crearUniforms, []);

  useFrame((_, delta) => {
    // hay que escribir en los uniforms DEL MATERIAL: ShaderMaterial clona los que
    // recibe por props, así que mutar el objeto original no llega a la GPU
    const u = material.current?.uniforms as Uniforms | undefined;
    if (!u) return;

    u.uTiempo.value += delta;
    renderizador.getDrawingBufferSize(u.uResolucion.value);
    u.uAngulo.value = ajustes.angulo;
    u.uDensidad.value = ajustes.densidad;
    u.uBandas.value = ajustes.bandas ? 1 : 0;
    u.uSemitono.value = ajustes.semitono ? 1 : 0;
    u.uGrano.value = ajustes.grano ? 1 : 0;
    u.uDesregistro.value = ajustes.desregistro ? 1 : 0;
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={material}
        depthTest={false}
        depthWrite={false}
        fragmentShader={fragmento}
        uniforms={iniciales}
        vertexShader={vertice}
      />
    </ScreenQuad>
  );
}
