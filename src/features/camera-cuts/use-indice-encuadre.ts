import { useEffect, useState } from "react";
import { encuadres } from "./encuadres";
import { indiceDesdeProgreso, progresoDesdeScroll } from "./progreso-scroll";

/**
 * Escucha el scroll y devuelve qué encuadre toca.
 *
 * Solo cambia el estado de React cuando cambia el ÍNDICE, no en cada fotograma:
 * los cortes son raros y el progreso continuo no tiene por qué pasar por el
 * reconciliador. Lo que sí corre por fotograma —los muelles de la cámara— vive
 * en useFrame y no toca React.
 */
export function useIndiceEncuadre(): number {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    function medir() {
      const recorrido = document.documentElement.scrollHeight - window.innerHeight;
      const progreso = progresoDesdeScroll(window.scrollY, recorrido);
      const siguiente = indiceDesdeProgreso(progreso, encuadres.length);
      setIndice((actual) => (actual === siguiente ? actual : siguiente));
    }

    medir();
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  return indice;
}
