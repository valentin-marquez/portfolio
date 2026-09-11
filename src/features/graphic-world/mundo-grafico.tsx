import { ScreenQuad } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type ShaderMaterial, Vector2, Vector3 } from "three";
import { ajustesDireccion } from "@/features/direction-panel/ajustes-direccion";
import { aVec3, paleta } from "@/shared/paleta";
import fragmento from "./mundo-grafico.frag.glsl?raw";
import vertice from "./mundo-grafico.vert.glsl?raw";

function crearUniforms() {
  return {
    uResolucion: { value: new Vector2(1, 1) },
    uTiempo: { value: 0 },
    uAngulo: { value: ajustesDireccion.mundo.angulo },
    uDensidad: { value: ajustesDireccion.mundo.densidad },
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
    // el color de la parada: cambia de golpe en el corte, sin muelle ni transición
    uFondo: { value: new Vector3(...aVec3(paleta.naranja)) },
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
export function MundoGrafico({ fondo }: { fondo: string }) {
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
    // se leen los ajustes vivos en cada fotograma: así el panel los mueve en
    // caliente sin que nada tenga que volver a renderizar
    const m = ajustesDireccion.mundo;
    u.uFondo.value.set(...aVec3(fondo));
    u.uAngulo.value = m.angulo;
    u.uDensidad.value = m.densidad;
    u.uBandas.value = m.bandas ? 1 : 0;
    u.uSemitono.value = m.semitono ? 1 : 0;
    u.uGrano.value = m.grano ? 1 : 0;
    u.uDesregistro.value = m.desregistro ? 1 : 0;
  });

  return (
    // renderOrder -1: el fondo SIEMPRE se dibuja primero. Sin esto compite en el
    // ordenador de opacos con el sujeto —están casi a la misma distancia de
    // cámara— y el resultado es una moneda al aire: unas veces queda detrás y
    // otras lo tapa entero.
    <ScreenQuad renderOrder={-1}>
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
