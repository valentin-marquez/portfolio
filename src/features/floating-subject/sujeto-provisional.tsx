import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { paleta } from "@/shared/paleta";

/**
 * Sujeto de reemplazo.
 *
 * No es el personaje: es un volumen con la altura y la anchura aproximadas del
 * modelo que vendrá (1,15 m de alto, unos 0,63 de ancho), puesto aquí para poder
 * dirigir encuadres, luz y cortes sin depender de la decisión abierta #4.
 *
 * Lleva su RELOJ PROPIO (§4.3): gira y deriva a su ritmo, indiferente al
 * visitante. El scroll solo decide desde dónde se le mira.
 */
export function SujetoProvisional() {
  const grupo = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    g.rotation.y += delta * 0.18;
    // deriva secundaria casi imperceptible: un solo eje limpio lee como
    // "producto en una tienda", dos descompensados leen como "sin gravedad"
    g.rotation.x += delta * 0.021;
    g.rotation.z += delta * 0.013;
  });

  return (
    <group ref={grupo} position={[0, 0.42, 0]}>
      <mesh>
        <capsuleGeometry args={[0.3, 0.52, 6, 16]} />
        <meshBasicMaterial color={paleta.cremaLuz} />
      </mesh>
      {/* el contorno se hará con casco invertido (§2.3); esto es solo su hueco */}
      <mesh scale={1.045}>
        <capsuleGeometry args={[0.3, 0.52, 6, 16]} />
        <meshBasicMaterial color={paleta.tinta} side={1} />
      </mesh>
    </group>
  );
}
