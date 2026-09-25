import { useEffect, useRef, useState } from "react";
import { escena } from "@/estado/escena";
import { elegirCalidad } from "@/prado/calidad";
import { soportaWebGL2 } from "@/prado/gl/soporte";
import { montarPrado, type Prado } from "@/prado/motor";

interface Props {
  alto: string;
  dientes: number;
  semilla: number;
  /** avisa el prado montado (o null al desmontar) y el elemento de la ventana */
  alMontar: (prado: Prado | null, elemento: HTMLDivElement | null) => void;
}

/** Una ventana del prado: canvas WebGL2 con los bordes disueltos, o un respaldo estático. */
export function VentanaPrado({ alto, dientes, semilla, alMontar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [respaldo, setRespaldo] = useState(false);

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    if (!soportaWebGL2()) {
      setRespaldo(true);
      return;
    }
    let prado: Prado | null = null;
    try {
      prado = montarPrado(canvas, {
        semilla,
        dientes,
        parametros: escena.parametros,
        calidad: elegirCalidad({
          anchoCss: window.innerWidth,
          dpr: window.devicePixelRatio || 1,
          nucleos: navigator.hardwareConcurrency || 4,
        }),
        reducirMovimiento: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    } catch (error) {
      console.error(error);
    }
    if (!prado) {
      setRespaldo(true);
      return;
    }
    const montado = prado;
    alMontar(montado, contenedor.current);
    const mover = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      montado.fijarPuntero(e.clientX - r.left, e.clientY - r.top);
    };
    const salir = () => montado.fijarPuntero(Number.NaN, Number.NaN);
    canvas.addEventListener("pointermove", mover);
    canvas.addEventListener("pointerleave", salir);
    return () => {
      canvas.removeEventListener("pointermove", mover);
      canvas.removeEventListener("pointerleave", salir);
      alMontar(null, null);
      montado.destruir();
    };
  }, [dientes, semilla, alMontar]);

  return (
    <div
      ref={contenedor}
      className="mx-auto w-[min(1000px,calc(100%-32px))]"
      style={{ height: alto }}
    >
      {respaldo ? (
        <div className="respaldo-prado h-full w-full" aria-hidden="true" />
      ) : (
        <canvas ref={lienzo} className="block h-full w-full" aria-hidden="true" tabIndex={-1} />
      )}
    </div>
  );
}
