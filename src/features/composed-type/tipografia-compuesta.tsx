import { useEffect, useState } from "react";
import { DoubleSide } from "three";
import { paleta } from "@/shared/paleta";
import {
  esperarFuente,
  FAMILIA_DISPLAY,
  type TexturaDeTexto,
  textoComoTextura,
} from "@/shared/texto-como-textura";

export type PalabraCompuesta = {
  texto: string;
  posicion: readonly [number, number, number];
  /** Alto en unidades de mundo. El ancho sale del aspecto de la textura. */
  alto: number;
  giro: number;
  color: string;
};

/**
 * Tipografía dentro de la escena 3D, no sobreimpresa.
 *
 * Vive en el mundo, en planos a distinta profundidad, para que **el sujeto la
 * ocluya** por buffer de profundidad — que es lo que hace que la composición
 * funcione en vez de parecer una pegatina encima. El parallax al cortar de
 * encuadre sale gratis por la misma razón.
 */
export function TipografiaCompuesta({ palabras }: { palabras: readonly PalabraCompuesta[] }) {
  const [texturas, setTexturas] = useState<TexturaDeTexto[] | null>(null);

  useEffect(() => {
    let vigente = true;

    esperarFuente(FAMILIA_DISPLAY).then(() => {
      if (!vigente) return;
      setTexturas(palabras.map((p) => textoComoTextura(p.texto.toUpperCase(), FAMILIA_DISPLAY)));
    });

    return () => {
      vigente = false;
    };
  }, [palabras]);

  useEffect(() => {
    return () => {
      for (const t of texturas ?? []) t.textura.dispose();
    };
  }, [texturas]);

  if (!texturas) return null;

  return (
    <>
      {palabras.map((palabra, i) => {
        const textura = texturas[i];
        if (!textura) return null;
        const ancho = palabra.alto / textura.aspecto;

        return (
          <mesh key={palabra.texto} position={[...palabra.posicion]} rotation-z={palabra.giro}>
            <planeGeometry args={[ancho, palabra.alto]} />
            <meshBasicMaterial
              alphaMap={textura.textura}
              // la máscara es blanco sobre negro: se recorta por alfa y el color
              // lo pone el material, así la misma textura vale para cualquier tono
              alphaTest={0.5}
              color={palabra.color}
              side={DoubleSide}
              toneMapped={false}
              transparent
            />
          </mesh>
        );
      })}
    </>
  );
}

/**
 * Reparto de partida, a profundidades distintas para que el parallax salga al
 * cortar de encuadre.
 *
 * Las palabras son PROVISIONALES: qué dice la pieza es la decisión abierta #2 y
 * depende del concepto (#1). Sirven de maniquí para dirigir tamaño, posición y
 * oclusión, nada más.
 */
export const palabrasPorDefecto: readonly PalabraCompuesta[] = [
  { texto: "uno", posicion: [-1.5, 1.9, -3.4], alto: 2.1, giro: 0.11, color: paleta.cremaLuz },
  { texto: "dos", posicion: [1.9, 0.5, -2.1], alto: 1.7, giro: -0.08, color: paleta.mostaza },
  { texto: "tres", posicion: [-1.1, -1.1, -1.2], alto: 1.3, giro: 0.05, color: paleta.cremaLuz },
];
