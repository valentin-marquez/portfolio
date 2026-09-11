import { useCallback, useState } from "react";
import { DoubleSide, MathUtils } from "three";
import { paleta } from "@/shared/paleta";
import type { TexturaDeTexto } from "@/shared/texto-como-textura";
import type { Punto } from "./forma-recortada";
import { Recorte } from "./recorte";

const ALTO_ETIQUETA = 0.042;

export type BarraMenu = {
  exterior: readonly Punto[];
  interior: readonly Punto[];
  ancho: number;
  x: number;
  y: number;
  giro: number;
};

/**
 * Una entrada del menú.
 *
 * Es navegación de verdad: pulsarla corta a su parada. Eso supera la regla de
 * "el scroll es el único control" que venía de la dirección descartada — el
 * scroll sigue funcionando igual y la barra es un atajo, no un sustituto.
 *
 * El estado activo invierte los colores en vez de añadir un realce: el interior
 * pasa a mostaza y la etiqueta a tinta. Es lo que hace Persona y además mantiene
 * el contraste alto en los dos sentidos (crema sobre tinta 13,7:1, tinta sobre
 * mostaza 9,8:1).
 */
export function BarraMenu({
  barra,
  etiqueta,
  activa,
  orden,
  alPulsar,
}: {
  barra: BarraMenu;
  etiqueta: TexturaDeTexto | null;
  activa: boolean;
  orden: number;
  alPulsar: () => void;
}) {
  const [encima, setEncima] = useState(false);
  const destacada = activa || encima;

  const entrar = useCallback(() => {
    setEncima(true);
    document.body.style.cursor = "pointer";
  }, []);

  const salir = useCallback(() => {
    setEncima(false);
    document.body.style.cursor = "";
  }, []);

  const anchoEtiqueta = etiqueta ? ALTO_ETIQUETA / etiqueta.aspecto : 0;

  return (
    // Esto no es un nodo del DOM sino un grupo de three: el control accesible de
    // verdad, con foco y nombre, vive en la capa oculta de `capa-accesible`.
    // biome-ignore lint/a11y/noStaticElementInteractions: grupo de three, no DOM
    <group
      onClick={alPulsar}
      onPointerOut={salir}
      onPointerOver={entrar}
      // la activa se adelanta un poco, como el elemento seleccionado de un menú
      position={[destacada ? 0.022 : 0, 0, 0]}
      rotation-z={destacada ? MathUtils.degToRad(-0.9) : 0}
    >
      <Recorte color={paleta.cremaLuz} orden={orden} puntos={barra.exterior} />
      <Recorte
        color={destacada ? paleta.mostaza : paleta.tinta}
        orden={orden + 1}
        puntos={barra.interior}
      />

      {etiqueta && (
        <mesh position={[-barra.ancho * 0.5 + anchoEtiqueta * 0.62, 0, 0]} renderOrder={orden + 2}>
          <planeGeometry args={[anchoEtiqueta, ALTO_ETIQUETA]} />
          <meshBasicMaterial
            alphaMap={etiqueta.textura}
            alphaTest={0.5}
            color={destacada ? paleta.tinta : paleta.cremaLuz}
            depthTest={false}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>
      )}
    </group>
  );
}
