import { motion, useReducedMotion } from "motion/react";
import { type ComponentType, useState } from "react";

const TINTA = "#1f1f1b";
/** en reposo el ícono queda en blanco y negro, oscuro como la tinta */
const APAGADO = "grayscale(1) brightness(0.5) contrast(1.25)";
const ENCENDIDO = "grayscale(0) brightness(1) contrast(1)";
/** el estirón del texto: rápido y con un rebote apenas visible */
const ESTIRON = { type: "spring", stiffness: 600, damping: 14, mass: 0.6 } as const;
const COLOR = { duration: 0.15, ease: [0, 0, 0.2, 1] } as const;

export type IconoVivo = ComponentType<{ className?: string; activo: boolean }>;

/**
 * Una palabra con su ícono. El hover es solo de la palabra: el texto se estira un poco y toma su
 * color, y el ícono se enciende y anima en loop mientras el mouse siga encima. Al salir, todo vuelve
 * con resorte a su estado inicial.
 */
export function PalabraViva({
  texto,
  color,
  Icono,
}: {
  texto: string;
  color: string;
  Icono: IconoVivo;
}) {
  const reducir = useReducedMotion() ?? false;
  const [activo, setActivo] = useState(false);

  return (
    <span
      className="inline-block whitespace-nowrap font-medium"
      onPointerEnter={(e) => e.pointerType !== "touch" && setActivo(true)}
      onPointerLeave={(e) => e.pointerType !== "touch" && setActivo(false)}
      // en pantallas táctiles no hay hover: un toque alterna
      onPointerDown={(e) => e.pointerType === "touch" && setActivo((a) => !a)}
    >
      <motion.span
        className="inline-block origin-bottom"
        initial={false}
        animate={{
          color: activo ? color : TINTA,
          scaleX: activo && !reducir ? 1.03 : 1,
          scaleY: activo && !reducir ? 1.03 : 1,
        }}
        transition={{ default: ESTIRON, color: COLOR }}
      >
        {texto}
      </motion.span>
      <motion.span
        aria-hidden="true"
        className="ml-[0.25em] inline-block align-[-0.2em]"
        initial={false}
        animate={{ filter: activo ? ENCENDIDO : APAGADO }}
        transition={COLOR}
      >
        <Icono className="block size-[1.2em] overflow-visible" activo={activo && !reducir} />
      </motion.span>
    </span>
  );
}
