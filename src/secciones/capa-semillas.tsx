import { useEffect, useRef } from "react";
import { COLUMNA, destinosAterrizaje, escena } from "@/estado/escena";
import { montarCapaSemillas } from "@/prado/capa-semillas";

const CANTIDAD_DESTINOS = 8;

/** Capa fija con las semillas que acompañan el recorrido. No captura el puntero. */
export function CapaSemillas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let capa: { destruir(): void } | null = null;
    try {
      capa = montarCapaSemillas(canvas, {
        progreso: () => escena.progreso,
        viento: () => escena.viento,
        origenes: () => escena.pradoHero?.cabezasEnPantalla() ?? [],
        destinos: () => {
          const el = escena.elCierre;
          return el ? destinosAterrizaje(el.getBoundingClientRect(), CANTIDAD_DESTINOS) : [];
        },
        rectHero: () => escena.elHero?.getBoundingClientRect() ?? null,
        columna: COLUMNA,
        reducirMovimiento: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    } catch (error) {
      console.error(error);
    }
    return () => capa?.destruir();
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none fixed inset-0 z-20 block h-full w-full"
    />
  );
}
