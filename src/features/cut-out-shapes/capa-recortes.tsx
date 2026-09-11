import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Group, MathUtils, type PerspectiveCamera } from "three";
import { paleta } from "@/shared/paleta";
import { interiorDesigual, rectanguloIrregular } from "./forma-recortada";
import { Recorte } from "./recorte";

/** Distancia a la que cuelga la capa por delante de la cámara. */
const DISTANCIA = 1;

const GROSOR = 0.02;

/**
 * La capa de interfaz: formas recortadas en espacio de pantalla.
 *
 * Cuelga de la CÁMARA, no de la escena, así que no obedece a la perspectiva ni a
 * los cortes de encuadre. Es la mitad "discreta" del mundo 2D (la continua —
 * bandas, trama, grano— la pone el shader de fondo).
 *
 * Cada forma lleva su propia inclinación: el ángulo holandés de la cámara aquí
 * no llega, porque estas piezas van con ella.
 */
export function CapaRecortes() {
  const camara = useThree((estado) => estado.camera) as PerspectiveCamera;
  const escena = useThree((estado) => estado.scene);
  const grupo = useRef<Group>(null);

  // three solo dibuja lo que cuelga de la escena, y R3F no mete la cámara por
  // defecto: sin esto la capa existe y no se ve
  useEffect(() => {
    escena.add(camara);
    return () => {
      escena.remove(camara);
    };
  }, [escena, camara]);

  useFrame(() => {
    // se escala para que una unidad sea la altura visible: así las coordenadas de
    // las formas son fracciones de pantalla y no dependen del fov
    const alto = 2 * DISTANCIA * Math.tan(MathUtils.degToRad(camara.fov / 2));
    grupo.current?.scale.setScalar(alto);
  });

  const caja = useMemo(() => {
    const exterior = rectanguloIrregular(0.86, 0.2, 1, 7);
    return { exterior, interior: interiorDesigual(exterior, GROSOR, 7) };
  }, []);

  const barras = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => {
        const exterior = rectanguloIrregular(0.4, 0.068, 1, 20 + i);
        return {
          exterior,
          interior: interiorDesigual(exterior, GROSOR * 0.8, 20 + i),
          y: 0.22 - i * 0.118,
          // nada se alinea al eje, y cada barra tiene su propio desvío
          giro: MathUtils.degToRad(-5 + i * 1.7),
          x: -0.54 + i * 0.012,
        };
      }),
    [],
  );

  return createPortal(
    <group ref={grupo} position={[0, 0, -DISTANCIA]}>
      {barras.map((barra, i) => (
        <group key={barra.y} position={[barra.x, barra.y, 0]} rotation-z={barra.giro}>
          <Recorte color={paleta.cremaLuz} orden={10 + i * 2} puntos={barra.exterior} />
          <Recorte color={paleta.tinta} orden={11 + i * 2} puntos={barra.interior} />
        </group>
      ))}

      <group position={[0.22, -0.16, 0]} rotation-z={MathUtils.degToRad(-4)}>
        <Recorte color={paleta.cremaLuz} orden={30} puntos={caja.exterior} />
        <Recorte color={paleta.tinta} orden={31} puntos={caja.interior} />
      </group>
    </group>,
    camara,
  );
}
