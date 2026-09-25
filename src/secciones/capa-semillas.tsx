import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { destinosAterrizaje, destinosJuntoALaFlor, escena } from "@/estado/escena";
import { montarCapaSemillas } from "@/prado/capa-semillas";
import { sentidoActual } from "@/prado/viento";

const CANTIDAD_DESTINOS = 8;

/** Capa fija con las semillas que acompañan el recorrido. No captura el puntero. */
export function CapaSemillas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let capa: ReturnType<typeof montarCapaSemillas> = null;
    try {
      capa = montarCapaSemillas(canvas, {
        progreso: () => escena.progreso,
        viento: () => escena.viento,
        origenes: () => escena.pradoHero?.cabezasEnPantalla() ?? [],
        destinos: () => {
          // si el cierre tiene su flor, las semillas vuelven a ella
          const flor = escena.pradoCierre?.cabezasEnPantalla()[0];
          if (flor) return destinosJuntoALaFlor(flor, CANTIDAD_DESTINOS);
          const el = escena.elCierre;
          return el ? destinosAterrizaje(el.getBoundingClientRect(), CANTIDAD_DESTINOS) : [];
        },
        rectHero: () => escena.elHero?.getBoundingClientRect() ?? null,
        zonaAterrizaje: () =>
          escena.zonaAterrizaje
            ? escena.zonaAterrizaje()
            : (escena.elCierre?.getBoundingClientRect() ?? null),
        // getter: cada composición puede ensanchar su contenido y las semillas lo respetan
        get columna() {
          return escena.columna;
        },
        reducirMovimiento: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        sentido: sentidoActual,
      });
    } catch (error) {
      console.error(error);
    }
    // al soplar una flor, sus semillas salen volando desde la cabeza
    const alSoplar = (cabeza: { x: number; y: number; radio: number }) =>
      capa?.soltar(cabeza, cabeza.radio);
    escena.alSoplar.push(alSoplar);
    return () => {
      escena.alSoplar = escena.alSoplar.filter((f) => f !== alSoplar);
      capa?.destruir();
    };
  }, []);

  // las semillas llegan después del prado: al cargar, nada flota sobre la página vacía
  return (
    <motion.canvas
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none fixed inset-0 z-20 block h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 1.2, ease: "easeOut" }}
    />
  );
}
