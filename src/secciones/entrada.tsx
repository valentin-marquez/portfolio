import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Aparición al cargar la página: desde el desenfoque, sin que nada salga de la nada. Con movimiento
 * reducido es solo un fundido corto.
 */
export function Entrada({
  children,
  retraso = 0,
  duracion = 1.4,
  desenfoque = 10,
  className,
}: {
  children: ReactNode;
  retraso?: number;
  duracion?: number;
  desenfoque?: number;
  className?: string;
}) {
  const reducir = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducir ? { opacity: 0 } : { opacity: 0, filter: `blur(${desenfoque}px)`, y: 8 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0, transitionEnd: { filter: "none" } }}
      transition={{
        duration: reducir ? 0.4 : duracion,
        delay: reducir ? 0 : retraso,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
