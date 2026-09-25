import { motion, useReducedMotion } from "motion/react";
import { type ComponentType, useMemo, useRef } from "react";
import { brotes } from "./brotes";
import { useRafaga } from "./rafaga-grupo";

const TINTA = "#1f1f1b";
const VERDES = ["#8fa46a", "#a9b98a", "#6f8a4a"];
/**
 * Lo que tarda la ola en cruzar el bloque de texto entero, en segundos. La referencia (shwn.design)
 * cambia el color en 150 ms sin escalonar; la ola se queda, pero cabe en ese mismo pestañeo.
 */
const CRUCE = 0.2;
/**
 * Al irse, la ráfaga vuelve a cruzar en el mismo sentido, algo más lenta: cada letra se mece apenas y
 * vuelve a la tinta a su paso, así la calma no llega de golpe.
 */
const CRUCE_SALIDA = 0.25;
/** curva que llega frenando */
const FRENANDO = [0.16, 1, 0.3, 1] as const;
/** el ease-out del color en la referencia */
const COLOR = { duration: 0.15, ease: [0, 0, 0.2, 1] } as const;
/** la calma empieza apenas sale el mouse y se asienta de a poco: sin pausa muerta al irse */
const COLOR_SALIDA = { duration: 0.3, ease: [0, 0, 0.2, 1] } as const;
/** en reposo el ícono queda en blanco y negro, oscuro como la tinta */
const APAGADO = "grayscale(1) brightness(0.5) contrast(1.25)";
const ENCENDIDO = "grayscale(0) brightness(1) contrast(1)";

interface Medida {
  /** borde izquierdo de la palabra dentro del grupo, px */
  x: number;
  ancho: number;
  anchoLetras: number;
  anchoGrupo: number;
}

/**
 * Una palabra en blanco y negro que se enciende con la ráfaga de su grupo: la ola le llega según
 * dónde está dentro del bloque, las letras se mecen y se colorean, y bajo ella brota pasto.
 */
export function PalabraViento({
  texto,
  color,
  Icono,
  semilla,
}: {
  texto: string;
  color: string;
  Icono: ComponentType<{ className?: string }>;
  semilla: number;
}) {
  const reducir = useReducedMotion() ?? false;
  const { activo, sentido, caja } = useRafaga();
  const ref = useRef<HTMLSpanElement>(null);
  const refLetras = useRef<HTMLSpanElement>(null);
  const medida = useRef<Medida | null>(null);
  const medidaDe = useRef<DOMRect | null>(null);

  // se mide al llegar cada ráfaga nueva; al irse se reusa la última para que la calma vuelva en orden
  if (activo && caja && caja !== medidaDe.current && ref.current) {
    const r = ref.current.getBoundingClientRect();
    medida.current = {
      x: r.left - caja.left,
      ancho: r.width,
      anchoLetras: refLetras.current?.getBoundingClientRect().width ?? r.width,
      anchoGrupo: caja.width,
    };
    medidaDe.current = caja;
  }
  const m = medida.current;

  /** cuándo le llega la ola a un punto de la palabra, en px desde su borde izquierdo */
  const llegada = (x: number, cruce = activo ? CRUCE : CRUCE_SALIDA) => {
    if (!m) return 0;
    const f = (m.x + x) / m.anchoGrupo;
    return (sentido === 1 ? f : 1 - f) * cruce;
  };
  const alIcono = llegada(m?.ancho ?? 0);

  const letras = [...texto];

  return (
    <span className="relative isolate inline-block whitespace-nowrap font-medium" ref={ref}>
      <span className="sr-only select-none">{texto}</span>
      <span aria-hidden="true" ref={refLetras}>
        {letras.map((letra, i) => {
          const retraso = llegada(((i + 0.5) / letras.length) * (m?.anchoLetras ?? 0));
          return (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: las letras de una palabra fija no se reordenan
              key={i}
              className="inline-block origin-bottom"
              initial={false}
              animate={
                activo
                  ? {
                      color,
                      y: reducir ? 0 : [0, -2.2, 0.4, 0],
                      rotate: reducir ? 0 : [0, 7 * sentido, -2 * sentido, 0],
                    }
                  : {
                      color: TINTA,
                      // la ráfaga que se va: un eco más suave del vaivén de entrada
                      y: reducir ? 0 : [0, -1, 0],
                      rotate: reducir ? 0 : [0, 3.5 * sentido, 0],
                    }
              }
              transition={
                activo
                  ? {
                      default: { duration: 0.4, delay: retraso, times: [0, 0.35, 0.7, 1] },
                      color: { ...COLOR, delay: retraso },
                    }
                  : {
                      default: { duration: 0.45, delay: retraso, ease: "easeInOut" },
                      color: { ...COLOR_SALIDA, delay: retraso },
                    }
              }
            >
              {letra}
            </motion.span>
          );
        })}
      </span>
      <motion.span
        aria-hidden="true"
        className="ml-[0.25em] inline-block origin-bottom align-[-0.2em]"
        initial={false}
        animate={
          activo
            ? { filter: ENCENDIDO, rotate: reducir ? 0 : [0, 12 * sentido, -5 * sentido, 0] }
            : { filter: APAGADO, rotate: reducir ? 0 : [0, 6 * sentido, 0] }
        }
        transition={
          activo
            ? {
                filter: { ...COLOR, delay: alIcono },
                rotate: { duration: 0.5, delay: alIcono, times: [0, 0.3, 0.7, 1] },
              }
            : {
                filter: { ...COLOR_SALIDA, delay: alIcono },
                rotate: { duration: 0.5, delay: alIcono, ease: "easeInOut" },
              }
        }
      >
        <Icono className="block size-[1.2em]" />
      </motion.span>
      {!reducir && m && (
        <Pasto
          activo={activo}
          ancho={m.ancho}
          sentido={sentido}
          semilla={semilla}
          llegada={llegada}
        />
      )}
    </span>
  );
}

const ALTO = 12;

/**
 * Pasto que brota bajo la palabra, detrás de las letras. Se monta con la primera ráfaga (antes no
 * hay medida), así que parte siempre sin crecer.
 */
function Pasto({
  activo,
  ancho,
  sentido,
  semilla,
  llegada,
}: {
  activo: boolean;
  ancho: number;
  sentido: 1 | -1;
  semilla: number;
  /** cuándo le llega la ola (la de entrada o la de salida) a un punto de la palabra */
  llegada: (x: number) => number;
}) {
  const briznas = useMemo(() => brotes(ancho, semilla), [ancho, semilla]);
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute bottom-px left-0 -z-10 overflow-visible"
      width={ancho}
      height={ALTO}
      viewBox={`0 0 ${ancho} ${ALTO}`}
    >
      {briznas.map((b, i) => {
        const retraso = llegada(b.x);
        const tipX = b.x + b.inclinacion;
        const tipY = ALTO - b.alto;
        return (
          // cada brizna se mece desde su base
          <motion.g
            // biome-ignore lint/suspicious/noArrayIndexKey: el pasto de una palabra es fijo
            key={i}
            style={{ originX: 0.5, originY: 1 }}
            initial={{ rotate: 0 }}
            // al irse la ráfaga, el pasto se inclina con ella mientras se recoge
            animate={{ rotate: activo ? [0, 10 * sentido, -3 * sentido, 0] : [0, 12 * sentido] }}
            transition={
              activo
                ? { duration: 0.55, delay: retraso + 0.05, times: [0, 0.3, 0.7, 1] }
                : { duration: 0.4, delay: retraso, ease: "easeOut" }
            }
          >
            <motion.path
              d={`M${b.x} ${ALTO}Q${b.x + b.inclinacion * 0.3} ${ALTO - b.alto * 0.55} ${tipX} ${tipY}`}
              fill="none"
              stroke={VERDES[b.tono]}
              strokeWidth={1.15}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={activo ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={
                activo
                  ? {
                      pathLength: { duration: 0.3, delay: retraso, ease: FRENANDO },
                      opacity: { duration: 0.1, delay: retraso },
                    }
                  : {
                      pathLength: { duration: 0.4, delay: retraso, ease: "easeIn" },
                      opacity: { duration: 0.25, delay: retraso + 0.15 },
                    }
              }
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
