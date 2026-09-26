// Íconos dibujados a mano para las palabras de la intro. Van a color; el blanco y negro en reposo lo
// pone quien los usa con un filtro. Con `activo` cada uno anima en loop su propio gesto, y al
// apagarse vuelve con resorte a su forma quieta.
import { motion } from "motion/react";

type Props = { className?: string; activo: boolean };

/** vuelta a la forma quieta, desde donde haya quedado el loop */
const QUIETO = { type: "spring", stiffness: 260, damping: 18 } as const;
const loop = (duracion: number, retraso = 0) =>
  ({
    duration: duracion,
    delay: retraso,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  }) as const;
/** el origen de las transformaciones en coordenadas del propio trazo */
const desde = (origen: string) => ({ transformBox: "fill-box", transformOrigin: origen }) as const;

/** interfaces: una ventana al prado; los puntos cargan en secuencia y el diente de león se mece */
export function IconoVentana({ className, activo }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="1.5" y="2.5" width="17" height="15" rx="3.2" fill="#35709c" />
      <rect x="3" y="6" width="14" height="10" rx="1.6" fill="#cfe2ee" />
      <path
        d="M3 13.4c3-2.4 6.3-2.3 8.8-1.1 2 .9 3.6.5 5.2-.4v2.5a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 14.4z"
        fill="#8fb069"
      />
      <motion.g
        style={desde("50% 100%")}
        initial={false}
        animate={activo ? { rotate: [0, 14, -8, 0] } : { rotate: 0 }}
        transition={activo ? loop(1.2) : QUIETO}
      >
        <path d="M12.9 12.6v-3.1" stroke="#6f8a4a" strokeWidth="0.6" strokeLinecap="round" />
        <circle cx="12.9" cy="9.1" r="1.25" fill="#fbfaf4" />
      </motion.g>
      {[4.5, 6.7, 8.9].map((cx, i) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy="4.25"
          r="0.75"
          fill="#f6f3ea"
          style={desde("50% 50%")}
          initial={false}
          animate={
            activo ? { opacity: [1, 0.35, 1], scale: [1, 1.35, 1] } : { opacity: 1, scale: 1 }
          }
          transition={activo ? loop(0.9, i * 0.15) : QUIETO}
        />
      ))}
    </svg>
  );
}

/** movimiento: una hoja que flota llevada por dos hilos de viento */
export function IconoHoja({ className, activo }: Props) {
  const hilo = activo
    ? { pathLength: [0, 1, 1], opacity: [0, 1, 0] }
    : { pathLength: 1, opacity: 1 };
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <motion.path
        d="M1.2 6.4h6.6c1.5 0 2-1.6 1-2.3-.7-.5-1.7-.1-1.6.8"
        fill="none"
        stroke="#8db6cf"
        strokeWidth="1.3"
        strokeLinecap="round"
        initial={false}
        animate={hilo}
        transition={activo ? loop(1.4) : QUIETO}
      />
      <motion.path
        d="M1 10h3.6"
        fill="none"
        stroke="#8db6cf"
        strokeWidth="1.3"
        strokeLinecap="round"
        initial={false}
        animate={hilo}
        transition={activo ? loop(1.4, 0.2) : QUIETO}
      />
      <motion.g
        style={desde("20% 90%")}
        initial={false}
        animate={
          activo
            ? { rotate: [0, -12, 5, 0], x: [0, 1, 0.5, 0], y: [0, -1.6, -0.6, 0] }
            : { rotate: 0, x: 0, y: 0 }
        }
        transition={activo ? loop(1.4) : QUIETO}
      >
        <path d="M6.3 16.6C5.8 11 9.4 6.6 18 4.2c.4 7.6-4.1 12.1-11.7 12.4z" fill="#7da24a" />
        <path
          d="M6.3 16.6c3-3.4 6-6.9 10.4-11.5"
          fill="none"
          stroke="#52742e"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <path d="M4.6 18.3l1.9-1.9" stroke="#52742e" strokeWidth="1.1" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

/** vivas: un dedal de oro, la flor naranja de los campos de acá; se mece y se abre */
export function IconoDedalDeOro({ className, activo }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <motion.g
        style={desde("50% 100%")}
        initial={false}
        animate={activo ? { rotate: [0, 8, -6, 0] } : { rotate: 0 }}
        transition={activo ? loop(1.3) : QUIETO}
      >
        <path
          d="M10 18.8c0-3.4.3-5.2 0-7.2"
          fill="none"
          stroke="#6f8a4a"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path d="M10.1 15.6c1.9-1.4 4.1-1.4 5.5-.6-1.7 1.5-3.8 1.7-5.5.6z" fill="#7da24a" />
        <path d="M9.9 14.3c-1.5-1-3.3-1-4.5-.3 1.4 1.2 3.1 1.3 4.5.3z" fill="#7da24a" />
        <motion.g
          style={desde("50% 100%")}
          initial={false}
          animate={
            activo ? { scaleX: [1, 1.14, 1], scaleY: [1, 0.94, 1] } : { scaleX: 1, scaleY: 1 }
          }
          transition={activo ? loop(1.3) : QUIETO}
        >
          <path
            d="M3.8 5.2c.5 4.3 3 6.9 6.2 6.9s5.7-2.6 6.2-6.9c-2.1 1.4-4.2 1.3-6.2-.9-2 2.2-4.1 2.3-6.2.9z"
            fill="#dc6f24"
          />
          <path
            d="M6.9 5c0 4.1 1.4 6.8 3.1 6.9 1.7-.1 3.1-2.8 3.1-6.9-.9-1.7-2-2.5-3.1-2.9-1.1.4-2.2 1.2-3.1 2.9z"
            fill="#f29a3d"
          />
          <path d="M8.6 11.3c.6 1.1 2.2 1.1 2.8 0z" fill="#6f8a4a" />
        </motion.g>
      </motion.g>
    </svg>
  );
}
