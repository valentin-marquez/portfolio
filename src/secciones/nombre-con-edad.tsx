import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { edadEntre, enSantiago, formatearEdad, NACIMIENTO } from "./edad";

const SALIDA = [0.16, 1, 0.3, 1] as const;

/** "Valentín" con un tooltip que cuenta cuánto llevo vivo, segundo a segundo. */
export function NombreConEdad() {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [ahora, setAhora] = useState(() => new Date());
  const tactil = useRef(false);

  useEffect(() => {
    if (!abierto) return;
    setAhora(new Date());
    const reloj = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(reloj);
  }, [abierto]);

  const edad = edadEntre(NACIMIENTO, enSantiago(ahora));
  const { calendario, reloj } = formatearEdad(edad);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-describedby={abierto ? id : undefined}
        className="cursor-help font-medium text-enfasis underline decoration-meta/60 decoration-dotted underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-acento/40"
        onPointerDown={(e) => {
          tactil.current = e.pointerType === "touch";
        }}
        onPointerEnter={(e) => e.pointerType !== "touch" && setAbierto(true)}
        onPointerLeave={(e) => e.pointerType !== "touch" && setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        // con el dedo no hay hover: el toque abre y cierra
        onClick={() => tactil.current && setAbierto((a) => !a)}
        onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
      >
        Valentín
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.span
            role="tooltip"
            id={id}
            className="pointer-events-none absolute bottom-full left-[-12px] z-20 mb-2 block whitespace-nowrap rounded-lg border border-enfasis/10 bg-[#fbf9f3] px-3 py-2 font-mono text-xs leading-5 text-enfasis shadow-[0_8px_24px_-10px_rgba(31,31,27,0.28)]"
            initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 2, filter: "blur(2px)" }}
            transition={{ duration: 0.22, ease: SALIDA }}
          >
            <span className="block">{calendario}</span>
            <span className="flex items-center gap-2 text-meta">
              {/* un pulso por segundo: sigue vivo */}
              <motion.span
                key={edad.segundos}
                className="size-1.5 rounded-full bg-acento"
                initial={{ scale: 1.7, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: SALIDA }}
              />
              {reloj}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
