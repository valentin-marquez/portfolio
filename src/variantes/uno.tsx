// Variante 1 · "El prado se queda": el hero queda fijo mientras scrolleas; primero se va el título,
// la cámara hace su movimiento (mirar al cielo, subir o avanzar) y el contenido llega. En el cierre el
// recorrido se deshace: la cámara vuelve a la vista del prado y el "nos vemos" queda en su bruma.
// El scroll pasa por un resorte: la cámara tiene inercia en vez de saltar muesca a muesca.
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useCallback, useRef } from "react";
import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import type { Parametros } from "@/prado/parametros";
import { Aparecer } from "@/secciones/aparecer";
import { Experimentos } from "@/secciones/experimentos";
import { RelojSantiago } from "@/secciones/reloj-santiago";
import { SobreMi } from "@/secciones/sobre-mi";
import { Titulo } from "@/secciones/titulo";
import { VentanaPrado } from "@/secciones/ventana-prado";
import { camaraCierre, camaraHero, heroQueSeQueda } from "./coreografia";

const ANCHO = "min(1180px, calc(100% - 32px))";
const RESORTE = { stiffness: 55, damping: 20, restDelta: 0.0005 };
const movimiento = () => escena.parametros.movimiento;

const alMontarHero = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoHero = prado;
  escena.elHero = elemento;
};
const alMontarCierre = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoCierre = prado;
  escena.elCierre = elemento;
};

export function VarianteUno() {
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end end"] });
  const progreso = useSpring(scrollYProgress, RESORTE);
  const opacidadTitulo = useTransform(
    progreso,
    (p) => heroQueSeQueda(p, movimiento()).titulo.opacidad,
  );
  const yTitulo = useTransform(progreso, (p) => heroQueSeQueda(p, movimiento()).titulo.y);
  const opacidadPrado = useTransform(
    progreso,
    (p) => heroQueSeQueda(p, movimiento()).prado.opacidad,
  );
  const escalaPrado = useTransform(progreso, (p) => heroQueSeQueda(p, movimiento()).prado.escala);
  const ajustarCamara = useCallback(
    (base: Parametros["camara"]) => camaraHero(base, progreso.get(), movimiento()),
    [progreso],
  );

  const cierre = useRef<HTMLElement>(null);
  const { scrollYProgress: scrollCierre } = useScroll({
    target: cierre,
    offset: ["start end", "end end"],
  });
  const progresoCierre = useSpring(scrollCierre, RESORTE);
  const ajustarCamaraCierre = useCallback(
    (base: Parametros["camara"]) => camaraCierre(base, progresoCierre.get(), movimiento()),
    [progresoCierre],
  );
  // forma de función a propósito: con rangos, Motion acelera la opacidad con la ScrollTimeline
  // nativa y la trata como "entrar y salir de la vista" (al final volvía a 0)
  const opacidadCierre = useTransform(progresoCierre, (p) => Math.min(1, Math.max(0, p / 0.55)));
  const yCierre = useTransform(progresoCierre, (p) => 90 * (1 - Math.min(1, Math.max(0, p / 0.8))));

  return (
    <main className="relative z-10">
      <section ref={hero} aria-label="Valentín Márquez" className="relative h-[170vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div style={{ opacity: opacidadPrado, scale: escalaPrado }} className="pt-[5vh]">
            <VentanaPrado
              alto="74vh"
              ancho={ANCHO}
              dientes={5}
              semilla={1}
              alMontar={alMontarHero}
              ajustarCamara={ajustarCamara}
            />
          </motion.div>
          <motion.div
            style={{ opacity: opacidadTitulo, y: yTitulo }}
            className="absolute inset-x-0 bottom-[12vh]"
          >
            <Titulo />
          </motion.div>
        </div>
      </section>

      {/* el contenido entra desde abajo mientras el prado se desvanece: sin tramo vacío */}
      <div className="relative z-10 -mt-[30vh]">
        <section className="mx-auto w-[560px] max-w-[calc(100%-32px)]">
          <Aparecer>
            <p>
              Aquí guardo experimentos: interfaces, movimiento y pequeñas piezas que se sienten
              vivas.
            </p>
          </Aparecer>
        </section>
        <Experimentos />
        <SobreMi />
      </div>

      <footer ref={cierre} className="relative mt-24 h-[125vh]">
        <div className="sticky top-0 flex h-screen flex-col justify-center">
          <motion.div style={{ opacity: opacidadCierre, y: yCierre }} className="relative">
            <VentanaPrado
              alto="66vh"
              ancho={ANCHO}
              dientes={3}
              semilla={2}
              alMontar={alMontarCierre}
              ajustarCamara={ajustarCamaraCierre}
            />
            <div className="absolute inset-x-0 bottom-[6%]">
              <div className="mx-auto flex w-[560px] max-w-[calc(100%-32px)] items-baseline justify-between">
                <span className="text-enfasis">nos vemos</span>
                <RelojSantiago />
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
