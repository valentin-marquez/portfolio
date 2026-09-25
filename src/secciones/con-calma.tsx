import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { visibleSegun } from "@/prado/motor";
import { sentidoActual, vientoEn } from "@/prado/viento";

const TEXTO = "con calma";
/** grados que se inclina una letra por unidad de viento: en el centro de una ráfaga fuerte, unos 12° */
const INCLINACION = 42;
/** vaivén propio de cada letra entre ráfagas, en grados */
const RESPIRO = 1.4;

/**
 * "con calma" mecido por el mismo viento que el prado: cada letra lee la ola en su posición de
 * pantalla, así cuando una ráfaga cruza el pasto también cruza la frase. Se escribe directo en el
 * estilo de cada letra, sin renders de React.
 */
export function ConCalma({ className }: { className?: string }) {
  const reducir = useReducedMotion();
  const letras = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const els = letras.current.filter((el): el is HTMLSpanElement => el !== null);
    if (reducir || els.length === 0) return;

    let xs: number[] = [];
    const medir = () => {
      xs = els.map((el) => {
        const r = el.getBoundingClientRect();
        return (r.left + r.width / 2) / window.innerWidth;
      });
    };
    medir();
    void document.fonts?.ready.then(medir);
    window.addEventListener("resize", medir);

    let visible = true;
    const observador = new IntersectionObserver((entradas) => {
      visible = visibleSegun(entradas);
    });
    observador.observe(els[0] as HTMLSpanElement);

    let raf = 0;
    const cuadro = (ahora: number) => {
      if (visible) {
        const t = ahora / 1000;
        const sentido = sentidoActual();
        els.forEach((el, i) => {
          const viento = vientoEn(xs[i] ?? 0.5, t);
          // además de la ola, cada letra respira apenas por su cuenta
          const respiro = Math.sin(t * 0.9 + i * 0.55) * RESPIRO;
          const grados = viento * INCLINACION * sentido + respiro;
          const dx = viento * 2 * sentido;
          el.style.transform = `translateX(${dx.toFixed(2)}px) rotate(${grados.toFixed(2)}deg)`;
        });
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      window.removeEventListener("resize", medir);
      for (const el of els) el.style.transform = "";
    };
  }, [reducir]);

  return (
    <span className={className}>
      <span className="sr-only select-none">{TEXTO}</span>
      <span aria-hidden="true">
        {[...TEXTO].map((letra, i) =>
          letra === " " ? (
            " "
          ) : (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: el texto es fijo
              key={i}
              ref={(el) => {
                letras.current[i] = el;
              }}
              className="inline-block origin-bottom will-change-transform"
            >
              {letra}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
