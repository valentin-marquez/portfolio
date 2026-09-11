import { useMemo } from "react";
import { Shape, ShapeGeometry } from "three";
import type { Punto } from "./forma-recortada";

/**
 * Un polígono plano de color liso.
 *
 * `depthTest` va apagado y el orden lo decide `orden`: estas formas viven en una
 * capa por delante de la escena y no compiten en profundidad con el sujeto.
 */
export function Recorte({
  puntos,
  color,
  orden,
}: {
  puntos: readonly Punto[];
  color: string;
  orden: number;
}) {
  const geometria = useMemo(() => {
    const primero = puntos[0];
    if (!primero) throw new Error("Un recorte necesita al menos un punto");

    const forma = new Shape();
    forma.moveTo(primero[0], primero[1]);
    for (const [x, y] of puntos.slice(1)) forma.lineTo(x, y);
    forma.closePath();
    return new ShapeGeometry(forma);
  }, [puntos]);

  return (
    <mesh geometry={geometria} renderOrder={orden}>
      <meshBasicMaterial
        color={color}
        depthTest={false}
        depthWrite={false}
        // sin esto el mapeo de tonos altera el color y la paleta deja de ser la paleta
        toneMapped={false}
      />
    </mesh>
  );
}
