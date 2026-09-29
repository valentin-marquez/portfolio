// El logo de cada lugar, con sus colores. El de Framerate.cl se dibuja aquí para que su cuadrado dé una
// vuelta cada vez que se enciende el pase, como hace en su propio sitio.
import { motion } from "motion/react";
import { type ReactNode, useRef, useState } from "react";
import bipsolar from "@/assets/logos/bipsolar.webp";
import expedio from "@/assets/logos/expedio.svg";
import fao from "@/assets/logos/fao.svg";

function Framerate({ activo }: { activo: boolean }) {
  // una vuelta entera por cada vez que se enciende; al apagarse se queda donde quedó
  const [vueltas, setVueltas] = useState(0);
  const antes = useRef(activo);
  if (activo !== antes.current) {
    antes.current = activo;
    if (activo) setVueltas((v) => v + 1);
  }
  return (
    <svg
      viewBox="0 0 448 448"
      className="size-6 text-enfasis"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 5C0 2.24 2.24 0 5 0H135.42C138.18 0 140.42 2.24 140.42 5V442.27C140.42 445.03 138.18 447.27 135.42 447.27H5C2.24 447.27 0 445.03 0 442.27V5Z" />
      <path d="M442.27 0C445.03 0 447.27 2.24 447.27 5V135.42C447.27 138.18 445.03 140.42 442.27 140.42H5C2.24 140.42 0 138.18 0 135.42L0 5C0 2.24 2.24 0 5 0H442.27Z" />
      <path d="M162 209.04C162 206.28 164.24 204.04 167 204.04H304.8C307.56 204.04 309.8 206.28 309.8 209.04V442C309.8 444.76 307.56 447 304.8 447H167C164.24 447 162 444.76 162 442V209.04Z" />
      <path d="M442 170C444.76 170 447 172.24 447 175V307.15C447 309.91 444.76 312.15 442 312.15H167C164.24 312.15 162 309.91 162 307.15V175C162 172.24 164.24 170 167 170H442Z" />
      <motion.rect
        x="339"
        y="339"
        width="108"
        height="108"
        rx="5"
        initial={false}
        animate={{ rotate: vueltas * 360 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  );
}

const imagen =
  (src: string, clase = "size-8") =>
  () => <img src={src} alt="" className={`${clase} object-contain`} draggable={false} />;

interface Logo {
  clave: string;
  dibujo: (activo: boolean) => ReactNode;
}

/** los logos de cada trabajo, por id; varios si el pase es de más de un lugar */
export const LOGOS: Record<string, Logo[]> = {
  fao: [{ clave: "fao", dibujo: imagen(fao) }],
  framerate: [{ clave: "framerate", dibujo: (activo) => <Framerate activo={activo} /> }],
  "bipsolar-expedio": [
    { clave: "bipsolar", dibujo: imagen(bipsolar) },
    { clave: "expedio", dibujo: imagen(expedio, "size-9") },
  ],
};
