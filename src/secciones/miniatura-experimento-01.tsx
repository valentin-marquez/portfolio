// La tarjeta del Experimento 01: monta la escena recién cuando la tarjeta se acerca a la pantalla (el
// código viene en un chunk aparte), muestra un cuadro fijo y se anima, sin sonido, con el mouse encima.
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { crearReloj } from "@/experimentos/experimento-01/reloj";
import { CUADRO_FIJO } from "@/experimentos/experimento-01/tiempo";

export function MiniaturaExperimento01() {
  const caja = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    let montaje: { seek(t: number): void; destruir(): void } | null = null;
    let cancelado = false;
    let cuadro = 0;
    const reloj = crearReloj(() => performance.now() / 1000);
    reloj.fijar(CUADRO_FIJO);
    reloj.pausar();

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting) || montaje) return;
        observador.disconnect();
        void import("@/experimentos/experimento-01/montar").then(({ montar }) => {
          if (cancelado) return;
          montaje = montar(el);
          montaje.seek(reloj.t());
        });
      },
      { rootMargin: "400px" },
    );
    observador.observe(el);

    // solo con un puntero que pueda hacer hover y sin pedir menos movimiento
    const puedeAnimar = matchMedia("(hover: hover)").matches && !reducir;
    const bucle = () => {
      montaje?.seek(reloj.t());
      cuadro = requestAnimationFrame(bucle);
    };
    const entrar = () => {
      if (!puedeAnimar) return;
      reloj.reanudar();
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(bucle);
    };
    const salir = () => {
      reloj.pausar();
      cancelAnimationFrame(cuadro);
    };
    el.addEventListener("pointerenter", entrar);
    el.addEventListener("pointerleave", salir);

    return () => {
      cancelado = true;
      observador.disconnect();
      cancelAnimationFrame(cuadro);
      el.removeEventListener("pointerenter", entrar);
      el.removeEventListener("pointerleave", salir);
      montaje?.destruir();
    };
  }, [reducir]);

  return <div ref={caja} className="h-full w-full" />;
}
