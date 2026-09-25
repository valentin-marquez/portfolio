import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Entrada suave al aparecer en pantalla: opacidad y un blur leve, una sola vez. */
export function Aparecer({ children, className }: { children: ReactNode; className?: string }) {
  const reducir = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducir ? false : { opacity: 0, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
