import { useFrame, useThree } from "@react-three/fiber";
import { Box3, Vector3 } from "three";

/**
 * Sonda de desarrollo: expone el estado de la escena en `window.__pieza`.
 *
 * Existe porque los fallos de esta pieza no dan error — compilan, corren y pintan
 * algo razonable, solo que mal. Poder preguntarle a la escena dónde está cada
 * cosa evita depurar a base de suposiciones.
 *
 * No entra en producción.
 */
export function SondaDev() {
  const escena = useThree((estado) => estado.scene);
  const camara = useThree((estado) => estado.camera);

  useFrame(() => {
    const caja = new Box3();
    const objetivos: Record<string, unknown> = {};

    for (const hijo of escena.children) {
      if (!hijo.name && hijo.type !== "Group") continue;
      caja.setFromObject(hijo);
      if (caja.isEmpty()) continue;
      const tamaño = caja.getSize(new Vector3());
      const centro = caja.getCenter(new Vector3());
      objetivos[hijo.name || hijo.type] = {
        centro: centro.toArray().map((v) => +v.toFixed(3)),
        tamaño: tamaño.toArray().map((v) => +v.toFixed(3)),
      };
    }

    (window as unknown as Record<string, unknown>).__pieza = {
      camara: {
        posicion: camara.position.toArray().map((v) => +v.toFixed(3)),
        rotacion: [camara.rotation.x, camara.rotation.y, camara.rotation.z].map(
          (v) => +v.toFixed(3),
        ),
      },
      hijosDeEscena: escena.children.map((h) => `${h.type}${h.name ? `:${h.name}` : ""}`),
      objetivos,
    };
  });

  return null;
}
