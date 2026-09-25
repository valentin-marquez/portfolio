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

/**
 * Una ventana del prado: canvas WebGL2 con los bordes disueltos. Sin WebGL2, o mientras el contexto
 * está perdido o falló, se ve un respaldo estático; el canvas sigue montado para poder recuperarse.
 */
export function VentanaPrado({ alto, dientes, semilla, alMontar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [sinSoporte, setSinSoporte] = useState(false);
  const [respaldo, setRespaldo] = useState(false);

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    if (!soportaWebGL2()) {
      setSinSoporte(true);
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
        alCambiarEstado: (estado) => setRespaldo(estado !== "activo"),
      });
    } catch (error) {
      console.error(error);
    }
    if (!prado) {
      setSinSoporte(true);
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
      className="relative mx-auto w-[min(1000px,calc(100%-32px))]"
      style={{ height: alto }}
    >
      {!sinSoporte && (
        <canvas
          ref={lienzo}
          className={`block h-full w-full ${respaldo ? "invisible" : ""}`}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      {(sinSoporte || respaldo) && (
        <div className="respaldo-prado absolute inset-0" aria-hidden="true" />
      )}
    </div>
  );
}
