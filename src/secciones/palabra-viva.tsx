import { motion, useReducedMotion } from "motion/react";
import { type ComponentType, createContext, type ReactNode, useContext, useState } from "react";

const TINTA = "#1f1f1b";
/** en reposo el ícono queda en blanco y negro, oscuro como la tinta */
const APAGADO = "grayscale(1) brightness(0.5) contrast(1.25)";
const ENCENDIDO = "grayscale(0) brightness(1) contrast(1)";
/** el estirón del texto: rápido y con un rebote apenas visible */
const ESTIRON = { type: "spring", stiffness: 600, damping: 14, mass: 0.6 } as const;
/** la vuelta, sin rebote: si oscila alrededor de 1, el texto titila al re-rasterizarse */
const VUELTA = { type: "spring", stiffness: 420, damping: 32, mass: 0.6 } as const;
const COLOR = { duration: 0.15, ease: [0, 0, 0.2, 1] } as const;

export type IconoVivo = ComponentType<{ className?: string; activo: boolean }>;

const Encendida = createContext(false);

/**
 * La frase que lleva las palabras vivas: al pasar el mouse por cualquier parte de ella se encienden
 * todas a la vez, sin retraso. En pantallas táctiles un toque alterna.
 */
export function FraseViva({ children, className }: { children: ReactNode; className?: string }) {
  const [activo, setActivo] = useState(false);
  return (
    <p
      className={className}
      onPointerEnter={(e) => e.pointerType !== "touch" && setActivo(true)}
      onPointerLeave={(e) => e.pointerType !== "touch" && setActivo(false)}
      onPointerDown={(e) => e.pointerType === "touch" && setActivo((a) => !a)}
    >
      <Encendida.Provider value={activo}>{children}</Encendida.Provider>
    </p>
  );
}

/**
 * Una palabra con su ícono, dentro de una FraseViva: encendida, el texto se estira un poco y toma su
 * color, y el ícono se colorea y anima en loop. Al apagarse vuelve con resorte a su estado inicial.
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
  const activo = useContext(Encendida);

  return (
    <span className="inline-block whitespace-nowrap font-medium">
      <motion.span
        className="inline-block origin-bottom"
        initial={false}
        animate={{
          color: activo ? color : TINTA,
          scaleX: activo && !reducir ? 1.03 : 1,
          scaleY: activo && !reducir ? 1.03 : 1,
        }}
        transition={{ default: activo ? ESTIRON : VUELTA, color: COLOR }}
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
