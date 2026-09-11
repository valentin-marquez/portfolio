import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils } from "three";
import type { Encuadre } from "./encuadres";
import { encuadres } from "./encuadres";
import { type AjusteMuelle, type EstadoMuelle, pasoMuelle } from "./muelle-tenso";

/**
 * Muelle tenso: ζ ≈ 0,61, alrededor de un 9% de sobrepaso.
 *
 * La cámara no se posa, aterriza (§2.2 del diseño). Subir la amortiguación hacia
 * 26 la lleva a sobrepaso cero y el golpe desaparece.
 */
const POSICION: AjusteMuelle = { rigidez: 170, amortiguacion: 16 };

/**
 * La mirada va con un muelle MÁS LENTO que la posición: así la cámara bascula al
 * llegar en vez de encajar de una pieza. Es un desacople de dos líneas y es la
 * mitad del carácter del movimiento.
 */
const MIRADA: AjusteMuelle = { rigidez: 110, amortiguacion: 17 };
const INCLINACION: AjusteMuelle = { rigidez: 140, amortiguacion: 15 };

type MuelleVec3 = { x: EstadoMuelle; y: EstadoMuelle; z: EstadoMuelle };
type Trio = readonly [number, number, number];

const quieto = (valor: number): EstadoMuelle => ({ valor, velocidad: 0 });
const quietoVec3 = ([x, y, z]: Trio): MuelleVec3 => ({
  x: quieto(x),
  y: quieto(y),
  z: quieto(z),
});

function pasoVec3(m: MuelleVec3, objetivo: Trio, ajuste: AjusteMuelle, dt: number): MuelleVec3 {
  return {
    x: pasoMuelle(m.x, objetivo[0], ajuste, dt),
    y: pasoMuelle(m.y, objetivo[1], ajuste, dt),
    z: pasoMuelle(m.z, objetivo[2], ajuste, dt),
  };
}

export function PlataformaCamara({ encuadre }: { encuadre: Encuadre }) {
  const camara = useThree((estado) => estado.camera);
  const primero = encuadres[0];
  if (!primero) throw new Error("No hay encuadres definidos");

  const muelles = useRef({
    posicion: quietoVec3(primero.posicion),
    mirada: quietoVec3(primero.mirarA),
    inclinacion: quieto(primero.inclinacion),
  });

  useFrame((_, delta) => {
    const m = muelles.current;

    m.posicion = pasoVec3(m.posicion, encuadre.posicion, POSICION, delta);
    m.mirada = pasoVec3(m.mirada, encuadre.mirarA, MIRADA, delta);
    m.inclinacion = pasoMuelle(m.inclinacion, encuadre.inclinacion, INCLINACION, delta);

    camara.position.set(m.posicion.x.valor, m.posicion.y.valor, m.posicion.z.valor);
    camara.lookAt(m.mirada.x.valor, m.mirada.y.valor, m.mirada.z.valor);
    // el ángulo holandés se aplica DESPUÉS de mirar: lookAt reescribe la
    // orientación entera, así que tocar la rotación antes no serviría de nada
    camara.rotateZ(MathUtils.degToRad(m.inclinacion.valor));
  });

  return null;
}
