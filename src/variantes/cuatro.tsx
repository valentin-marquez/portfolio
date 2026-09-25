// Variante 4 · Presentación que avanza en su lugar. La página no baja: el scroll (rueda, trackpad,
// táctil o teclado) avanza de a un paso. En la portada está el prado; al avanzar la cámara entra en él
// mientras se disuelve en bruma y, donde desaparece, emerge el contenido. Al final el prado vuelve.
import {
  type MotionValue,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { experimentos } from "@/contenido/experimentos";
import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import type { Parametros } from "@/prado/parametros";
import { RelojSantiago } from "@/secciones/reloj-santiago";
import { Titulo } from "@/secciones/titulo";
import { VentanaPrado } from "@/secciones/ventana-prado";
import { camaraPresentacion, estadoPresentacion, PASOS } from "./presentacion";

const ANCHO = "min(1180px, calc(100% - 32px))";
// resorte lento a propósito: cada paso tarda ~1,5 s y el avance 3D alcanza a sentirse
const RESORTE = { stiffness: 12, damping: 7, restDelta: 0.0005 };
const N = PASOS.length;
/** el contenido de la presentación es más ancho que la columna de texto: las semillas lo rodean */
const ANCHO_CONTENIDO = 760;

const alMontarPrado = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoHero = prado;
  escena.elHero = elemento;
  escena.pradoCierre = null;
  escena.elCierre = elemento;
};

function useModoTitulo() {
  // el panel de depuración cambia el modo sin pasar por React: se revisa cada tanto
  const [modo, setModo] = useState(escena.parametros.titulo);
  useEffect(() => {
    const id = window.setInterval(() => setModo(escena.parametros.titulo), 300);
    return () => window.clearInterval(id);
  }, []);
  return modo;
}

function Paso({
  indice,
  posicion,
  reducir,
  children,
}: {
  indice: number;
  posicion: MotionValue<number>;
  reducir: boolean;
  children: ReactNode;
}) {
  const estado = (s: number) => estadoPresentacion(s).paneles[indice];
  const opacidad = useTransform(posicion, (s) => estado(s)?.opacidad ?? 0);
  const filtro = useTransform(posicion, (s) => {
    const d = reducir ? 0 : (estado(s)?.desenfoque ?? 0);
    return d > 0.05 ? `blur(${d.toFixed(2)}px)` : "none";
  });
  const escala = useTransform(posicion, (s) => (reducir ? 1 : (estado(s)?.escala ?? 1)));
  const eventos = useTransform(posicion, (s) =>
    (estado(s)?.opacidad ?? 0) > 0.5 ? "auto" : "none",
  );
  return (
    <motion.div
      style={{ opacity: opacidad, filter: filtro, scale: escala, pointerEvents: eventos }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
    >
      {children}
    </motion.div>
  );
}

export function Presentacion() {
  const reducir = useReducedMotion() ?? false;
  const modoTitulo = useModoTitulo();
  const ventana = useRef<HTMLDivElement>(null);
  const primerPaso = useRef<HTMLDivElement>(null);
  const altoPaso = useRef(window.innerHeight);

  useEffect(() => {
    document.documentElement.classList.add("presentacion");
    escena.columna = ANCHO_CONTENIDO;
    const medir = () => {
      altoPaso.current = primerPaso.current?.offsetHeight || window.innerHeight;
    };
    medir();
    window.addEventListener("resize", medir);
    return () => {
      document.documentElement.classList.remove("presentacion");
      escena.columna = 560;
      window.removeEventListener("resize", medir);
    };
  }, []);

  const { scrollY } = useScroll();
  const posicionCruda = useTransform(scrollY, (y) => y / Math.max(1, altoPaso.current));
  const posicion = useSpring(posicionCruda, RESORTE);

  const opacidadPrado = useTransform(posicion, (s) => estadoPresentacion(s).prado.opacidad);
  useMotionValueEvent(opacidadPrado, "change", (v) => {
    escena.pradoHero?.fijarEnPausa(v <= 0.001);
  });
  useEffect(() => {
    // las semillas solo aterrizan donde el prado se ve
    escena.zonaAterrizaje = () =>
      opacidadPrado.get() > 0.5 ? (ventana.current?.getBoundingClientRect() ?? null) : null;
    return () => {
      escena.zonaAterrizaje = null;
    };
  }, [opacidadPrado]);

  const ajustarCamara = useCallback(
    (base: Parametros["camara"]) => (reducir ? base : camaraPresentacion(base, posicion.get())),
    [posicion, reducir],
  );

  // título: al frente del prado en la portada y, al avanzar, arriba como encabezado
  const alFrente = modoTitulo === "frente";
  const opacidadTituloFrente = useTransform(posicion, (s) =>
    alFrente ? 1 - Math.min(1, Math.max(0, s / 0.4)) : 0,
  );
  const yTituloFrente = useTransform(posicion, (s) => -60 * Math.min(1, Math.max(0, s / 0.4)));
  const opacidadEncabezado = useTransform(posicion, (s) =>
    alFrente ? Math.min(1, Math.max(0, (s - 0.3) / 0.5)) : 1,
  );
  const numeroPaso = useTransform(
    posicion,
    (s) =>
      `${String(Math.round(Math.min(N - 1, Math.max(0, s))) + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`,
  );
  const opacidadPista = useTransform(posicion, (s) => 1 - Math.min(1, Math.max(0, s / 0.25)));

  return (
    <main className="relative">
      <div className="pointer-events-none fixed inset-0 z-10">
        <motion.header
          style={{ opacity: opacidadEncabezado, width: ANCHO }}
          className="absolute top-[4.5vh] left-1/2 flex -translate-x-1/2 items-baseline justify-between"
        >
          <p>
            <span className="font-medium text-enfasis">Valentín Márquez</span>
            <span className="ml-3 text-meta">ingeniero de sistemas</span>
          </p>
          <motion.span className="font-mono text-xs text-meta">{numeroPaso}</motion.span>
        </motion.header>

        <div
          ref={ventana}
          className="absolute top-[12vh] left-1/2 -translate-x-1/2"
          style={{ width: ANCHO, height: "74vh" }}
        >
          <motion.div
            style={{ opacity: opacidadPrado }}
            className="pointer-events-auto absolute inset-0"
          >
            <VentanaPrado
              alto="100%"
              ancho="100%"
              dientes={5}
              semilla={1}
              alMontar={alMontarPrado}
              ajustarCamara={ajustarCamara}
            />
          </motion.div>

          <Paso indice={0} posicion={posicion} reducir={reducir}>
            <motion.div
              style={{ opacity: opacidadTituloFrente, y: yTituloFrente }}
              className="absolute inset-x-0 bottom-[9%] text-left"
            >
              {alFrente && <Titulo />}
            </motion.div>
            <motion.p
              style={{ opacity: opacidadPista }}
              className="absolute bottom-[2%] font-mono text-xs text-meta"
            >
              ↓ avanzar
            </motion.p>
          </Paso>

          <Paso indice={1} posicion={posicion} reducir={reducir}>
            <p className="max-w-[640px] text-[clamp(18px,1.7vw,24px)] leading-[1.45] text-enfasis">
              Hola. Soy Valentín, ingeniero de sistemas. Construyo cosas{" "}
              <span className="font-mano text-[1.35em] leading-none text-acento">con calma</span> y
              con cuidado.
            </p>
            <p className="mt-5 max-w-[520px]">
              Aquí guardo experimentos: interfaces, movimiento y pequeñas piezas que se sienten
              vivas.
            </p>
          </Paso>

          {experimentos.map((e, k) => (
            <Paso key={e.id} indice={2 + k} posicion={posicion} reducir={reducir}>
              <div className="aspect-[16/10] w-[min(720px,88%)] rounded-[24px] bg-[#efebe1] ring-1 ring-black/[0.03]" />
              <div className="mt-4 flex w-[min(720px,88%)] items-baseline justify-between text-left">
                <span className="text-enfasis">{e.titulo}</span>
                <span className="font-mono text-xs text-meta">{e.anio}</span>
              </div>
              <p className="mt-1 w-[min(720px,88%)] text-left">
                Una línea sobre qué es y qué explora.
              </p>
            </Paso>
          ))}

          <Paso indice={6} posicion={posicion} reducir={reducir}>
            <h2 className="text-sm font-medium text-enfasis">Sobre mí</h2>
            <p className="mt-4 max-w-[560px]">
              Ingeniero en Ejecución en Informática, mención Desarrollo de Sistemas. Me gusta el
              software que se ve simple por fuera y está bien pensado por dentro.
            </p>
          </Paso>

          <Paso indice={7} posicion={posicion} reducir={reducir}>
            <div className="absolute inset-x-0 bottom-[8%]">
              <div className="mx-auto flex w-[560px] max-w-[calc(100%-32px)] items-baseline justify-between">
                <span className="text-enfasis">nos vemos</span>
                <RelojSantiago />
              </div>
            </div>
          </Paso>
        </div>
      </div>

      {/* la pista: una pantalla por paso, con encaje; no se ve, solo lleva el avance */}
      {PASOS.map((paso, i) => (
        <div
          key={paso}
          ref={i === 0 ? primerPaso : undefined}
          aria-hidden="true"
          className="h-[100svh] snap-start snap-always"
        />
      ))}
    </main>
  );
}
