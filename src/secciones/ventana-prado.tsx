import { useEffect, useRef, useState } from "react";
import { escena } from "@/estado/escena";
import { elegirCalidad } from "@/prado/calidad";
import { soportaWebGL2 } from "@/prado/gl/soporte";
import { montarPrado, type Prado } from "@/prado/motor";
import type { Parametros } from "@/prado/parametros";
import type { Diente } from "@/prado/pasto";

interface Props {
  alto: string;
  /** ancho CSS de la ventana; por defecto min(1000px, 100% − 32px) */
  ancho?: string;
  /** cuántos dientes de león, o las flores puestas a mano */
  dientes: number | Diente[];
  semilla: number;
  /** foco propio de esta ventana */
  foco?: Partial<Parametros["foco"]>;
  /** radio de las cabezas en esta ventana (m) */
  radioCabeza?: number;
  /** avisa el prado montado (o null al desmontar) y el elemento de la ventana */
  alMontar: (prado: Prado | null, elemento: HTMLDivElement | null) => void;
  /** cada cuadro la página puede mover la cámara, por ejemplo según el scroll */
  ajustarCamara?: (base: Parametros["camara"]) => Parametros["camara"];
}

/**
 * Una ventana del prado: canvas WebGL2 con los bordes disueltos. Sin WebGL2, o mientras el contexto
 * está perdido o falló, se ve un respaldo estático; el canvas sigue montado para poder recuperarse.
 */
export function VentanaPrado({
  alto,
  ancho,
  dientes,
  semilla,
  foco,
  radioCabeza,
  alMontar,
  ajustarCamara,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  // el ajuste de cámara cambia de identidad entre renders; se lee por ref para no remontar el prado
  const ajuste = useRef(ajustarCamara);
  ajuste.current = ajustarCamara;
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
        foco,
        radioCabeza,
        parametros: escena.parametros,
        calidad: elegirCalidad({
          anchoCss: window.innerWidth,
          dpr: window.devicePixelRatio || 1,
          nucleos: navigator.hardwareConcurrency || 4,
        }),
        reducirMovimiento: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        alCambiarEstado: (estado) => setRespaldo(estado !== "activo"),
        ajustarCamara: (base) => (ajuste.current ? ajuste.current(base) : base),
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
  }, [dientes, semilla, foco, radioCabeza, alMontar]);

  return (
    <div
      ref={contenedor}
      className={`relative mx-auto ${ancho ? "" : "w-[min(1000px,calc(100%-32px))]"}`}
      style={{ height: alto, width: ancho }}
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
