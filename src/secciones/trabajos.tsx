// Trabajos: un pase por lugar, colgado de su cinta. Los pases se mecen con el mismo viento que el
// prado (la ola los alcanza cuando pasa por su lugar en la pantalla) y el puntero los empuja al pasar.
// Al tocar uno, el pase se levanta hasta el centro y al lado aparece lo que hice ahí.
import {
  motion,
  useAnimate,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { type RefObject, useCallback, useLayoutEffect, useRef, useState } from "react";
import { enumerar, periodo, type Trabajo, trabajos } from "@/contenido/trabajos";
import { escena } from "@/estado/escena";
import { sentidoActual, vientoEn } from "@/prado/viento";
import { Aparecer } from "./aparecer";
import { Argolla, Cinta, COLOR, Pase } from "./pase";
import { pasoPendulo } from "./pendulo";

/** cada pase cuelga un poco distinto: ángulo de reposo y cuánto más abajo queda */
const REPOSO = [-1.4, 0.9, -0.4];
const CAIDA = [0, 18, 8];
/** la cinta que se ve sobre cada pase, y el punto desde donde cuelga (arriba, fuera de la vista) */
const CINTA = 112;
/** grados que gira un pase con la ráfaga más fuerte */
const EMPUJE_VIENTO = 9;

interface Origen {
  rect: DOMRect;
  giro: number;
}

export function Trabajos() {
  const [abierto, setAbierto] = useState<number | null>(null);
  const origen = useRef<Origen | null>(null);
  const pases = useRef<Array<HTMLElement | null>>([]);

  const abrir = useCallback((i: number, giro: number) => {
    const el = pases.current[i];
    if (!el) return;
    origen.current = { rect: el.getBoundingClientRect(), giro };
    setAbierto(i);
  }, []);

  return (
    <section
      aria-labelledby="titulo-trabajos"
      className="mx-auto w-[560px] max-w-[calc(100%-32px)] pt-14"
    >
      <Aparecer>
        <div className="flex items-baseline justify-between">
          <h2 id="titulo-trabajos" className="text-sm font-medium text-enfasis">
            Trabajos
          </h2>
          <span className="font-mono text-xs text-meta">toca un pase</span>
        </div>
        <ul
          className="-mx-4 mt-2 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-8 [scrollbar-width:none] min-[600px]:mx-0 min-[600px]:justify-between min-[600px]:overflow-visible min-[600px]:px-0"
          style={{ paddingTop: CINTA + 4 }}
        >
          {trabajos.map((t, i) => (
            <li key={t.id} className="shrink-0 snap-center" style={{ marginTop: CAIDA[i] }}>
              <Colgado
                trabajo={t}
                reposo={REPOSO[i] ?? 0}
                oculto={abierto === i}
                quieto={abierto !== null}
                refPase={(el) => {
                  pases.current[i] = el;
                }}
                alAbrir={(giro) => abrir(i, giro)}
              />
            </li>
          ))}
        </ul>
      </Aparecer>
      <Detalle
        trabajo={abierto === null ? null : (trabajos[abierto] ?? null)}
        origen={origen}
        pase={abierto === null ? null : (pases.current[abierto] ?? null)}
        alCerrar={() => setAbierto(null)}
      />
    </section>
  );
}

function Colgado({
  trabajo,
  reposo,
  oculto,
  quieto,
  refPase,
  alAbrir,
}: {
  trabajo: Trabajo;
  reposo: number;
  oculto: boolean;
  /** con el detalle abierto no se mece: está detrás del desenfoque y moverlo obliga a recalcularlo */
  quieto: boolean;
  refPase: (el: HTMLElement | null) => void;
  alAbrir: (giro: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const giro = useMotionValue(reposo);
  const pendulo = useRef({ angulo: reposo, velocidad: 0 });
  const [activo, setActivo] = useState(false);
  const reducir = useReducedMotion();
  const enVista = useInView(ref, { margin: "120px" });

  useAnimationFrame((_, delta) => {
    const el = ref.current;
    if (reducir || quieto || !enVista || !el) return;
    const r = el.getBoundingClientRect();
    // la ola cruza la pantalla: el pase la siente cuando el frente pasa por su centro
    const x = (r.left + r.width / 2) / window.innerWidth;
    const ola = vientoEn(x, performance.now() / 1000);
    // la ráfaga empuja la parte de abajo hacia donde sopla (girar a la derecha la lleva a la izquierda)
    pasoPendulo(pendulo.current, reposo - sentidoActual() * ola * EMPUJE_VIENTO, delta / 1000);
    giro.set(pendulo.current.angulo);
  });

  return (
    <motion.div
      ref={ref}
      className="relative"
      style={{
        rotate: giro,
        transformOrigin: `50% -${CINTA}px`,
        visibility: oculto ? "hidden" : undefined,
      }}
    >
      <Cinta trabajo={trabajo} alto={`${CINTA}px`} />
      <Argolla />
      <button
        ref={refPase}
        type="button"
        aria-haspopup="dialog"
        aria-label={`${trabajo.empresa}, ${trabajo.rol}, ${periodo(trabajo)}. Ver la experiencia`}
        className="boton-pase block cursor-pointer rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-4"
        style={{ outlineColor: COLOR[trabajo.color] }}
        onPointerEnter={() => setActivo(true)}
        onPointerLeave={() => setActivo(false)}
        onPointerMove={(e) => {
          // pasar el puntero por encima lo empuja un poco, hacia donde se movió
          if (!reducir) pendulo.current.velocidad -= e.movementX * 0.6;
        }}
        onFocus={() => setActivo(true)}
        onBlur={() => setActivo(false)}
        onClick={() => alAbrir(giro.get())}
      >
        <Pase trabajo={trabajo} activo={activo} />
      </button>
    </motion.div>
  );
}

/** abrir: el pase sube con un leve vaivén, como algo que cuelga */
const SUBIR = { type: "spring", stiffness: 150, damping: 17 } as const;
const BAJAR = { duration: 0.34, ease: [0.4, 0, 0.2, 1] } as const;

function Detalle({
  trabajo,
  origen,
  pase,
  alCerrar,
}: {
  trabajo: Trabajo | null;
  origen: RefObject<Origen | null>;
  pase: HTMLElement | null;
  alCerrar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [alcance, animar] = useAnimate<HTMLDivElement>();
  const reducir = useReducedMotion();
  const cerrando = useRef(false);

  // cuánto hay que mover el pase del diálogo para que quede exactamente sobre el de la lista
  const distancia = useCallback(() => {
    const destino = alcance.current?.querySelector("[data-pase]")?.getBoundingClientRect();
    const desde = pase?.getBoundingClientRect() ?? origen.current?.rect;
    if (!destino || !desde) return { x: 0, y: 0 };
    return { x: desde.left - destino.left, y: desde.top - destino.top };
  }, [alcance, origen, pase]);

  useLayoutEffect(() => {
    const d = dialogo.current;
    if (!trabajo || !d) return;
    cerrando.current = false;
    if (!d.open) d.showModal();
    // los prados quedan detrás del desenfoque: dibujarlos solo obligaría a recalcularlo
    escena.pradoHero?.fijarEnPausa(true);
    escena.pradoCierre?.fijarEnPausa(true);
    const { x, y } = distancia();
    const giro = origen.current?.giro ?? 0;
    if (reducir) {
      animar("[data-fondo], [data-contenido]", { opacity: [0, 1] }, { duration: 0.2 });
      return;
    }
    animar("[data-colgado]", { x: [x, 0], y: [y, 0], rotate: [giro, -1.5] }, SUBIR);
    animar("[data-fondo]", { opacity: [0, 1] }, { duration: 0.3 });
    animar(
      "[data-contenido]",
      { opacity: [0, 1], filter: ["blur(4px)", "blur(0px)"] },
      { duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] },
    );
    // el lector acepta el pase: una luz recorre el código una vez
    animar(
      "[data-colgado] [data-escaner]",
      { x: [-40, 170], opacity: [0, 1, 1, 0] },
      { duration: 0.7, delay: 0.45, ease: "easeInOut" },
    );
  }, [trabajo, animar, distancia, origen, reducir]);

  const cerrar = useCallback(async () => {
    const d = dialogo.current;
    if (!d || cerrando.current) return;
    cerrando.current = true;
    if (reducir) {
      await animar("[data-fondo], [data-contenido]", { opacity: 0 }, { duration: 0.15 });
    } else {
      const { x, y } = distancia();
      await Promise.all([
        animar("[data-contenido]", { opacity: 0 }, { duration: 0.14 }),
        animar("[data-colgado]", { x, y, rotate: origen.current?.giro ?? 0 }, BAJAR),
        animar("[data-fondo]", { opacity: 0 }, { duration: 0.3, delay: 0.06 }),
      ]);
    }
    d.close();
    escena.pradoHero?.fijarEnPausa(false);
    escena.pradoCierre?.fijarEnPausa(false);
    alCerrar();
    // el pase de la lista vuelve a verse en el cuadro siguiente: recién ahí puede recibir el foco
    requestAnimationFrame(() => pase?.focus({ preventScroll: true }));
  }, [alCerrar, animar, distancia, origen, pase, reducir]);

  const presente = trabajo?.hasta === undefined;

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-trabajo"
      className="detalle-trabajo"
      onCancel={(e) => {
        // Esc: que se vaya con la misma animación que al cerrar
        e.preventDefault();
        void cerrar();
      }}
    >
      {trabajo && (
        <div ref={alcance} className="relative min-h-full">
          <div
            data-fondo
            aria-hidden="true"
            className="fixed inset-0 bg-fondo/80 backdrop-blur-md"
            onClick={() => void cerrar()}
          />
          <div className="pointer-events-none relative mx-auto grid w-[min(860px,calc(100%-32px))] grid-cols-1 justify-items-center gap-10 pt-[max(18vh,150px)] pb-16 min-[760px]:grid-cols-[168px_1fr] min-[760px]:justify-items-start min-[760px]:gap-16">
            <div data-colgado className="relative" style={{ transformOrigin: `50% -${CINTA}px` }}>
              <Cinta trabajo={trabajo} alto="calc(max(18vh, 150px) + 8px)" />
              <Argolla />
              <Pase trabajo={trabajo} activo />
            </div>
            <div data-contenido className="pointer-events-auto max-w-[520px]">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3
                    id="titulo-trabajo"
                    className="text-[20px] leading-7 font-medium tracking-[-0.01em] text-enfasis"
                  >
                    {trabajo.rol}
                  </h3>
                  <p className="mt-1">{trabajo.organizacion}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void cerrar()}
                  className="-mt-0.5 shrink-0 cursor-pointer rounded-md px-2 py-1 font-mono text-xs text-meta transition-colors duration-150 hover:text-enfasis focus-visible:outline-2 focus-visible:outline-acento"
                >
                  cerrar
                </button>
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-meta">
                <span>{periodo(trabajo)}</span>
                {trabajo.lugar && <span>{trabajo.lugar}</span>}
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${presente ? "bg-[#7fae4b] shadow-[0_0_6px_#9fcf6a]" : "bg-meta/60"}`}
                  />
                  {presente ? "vigente" : "vencido"}
                </span>
              </p>
              <p className="mt-5 text-enfasis/85">{trabajo.resumen}</p>
              <ul className="mt-5 space-y-2.5">
                {trabajo.puntos.map((punto) => (
                  <li key={punto} className="relative pl-4">
                    <span
                      aria-hidden="true"
                      className="absolute top-[10px] left-0 size-1.5 rounded-full"
                      style={{ backgroundColor: COLOR[trabajo.color] }}
                    />
                    {punto}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[13px] leading-5 text-meta">
                {enumerar(trabajo.herramientas)}.
              </p>
              {trabajo.enlace && (
                <a
                  href={trabajo.enlace.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-enfasis underline decoration-enfasis/25 underline-offset-4 transition-colors duration-150 hover:decoration-enfasis/70"
                >
                  {trabajo.enlace.texto}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
