// Variante 1 · "El prado se queda": el hero queda fijo mientras scrolleas; primero se va el título,
// la cámara sube de a poco y el prado se desvanece al llegar el contenido. En el cierre el prado
// vuelve subiendo desde abajo y el "nos vemos" queda en su bruma.
import { motion, useScroll, useTransform } from "motion/react";
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
import { camaraSegunScroll, heroQueSeQueda } from "./coreografia";

const ANCHO = "min(1180px, calc(100% - 32px))";

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
  const opacidadTitulo = useTransform(scrollYProgress, (p) => heroQueSeQueda(p).titulo.opacidad);
  const yTitulo = useTransform(scrollYProgress, (p) => heroQueSeQueda(p).titulo.y);
  const opacidadPrado = useTransform(scrollYProgress, (p) => heroQueSeQueda(p).prado.opacidad);
  const escalaPrado = useTransform(scrollYProgress, (p) => heroQueSeQueda(p).prado.escala);
  const ajustarCamara = useCallback(
    (base: Parametros["camara"]) => camaraSegunScroll(base, scrollYProgress.get()),
    [scrollYProgress],
  );

  const cierre = useRef<HTMLElement>(null);
  const { scrollYProgress: progresoCierre } = useScroll({
    target: cierre,
    offset: ["start end", "end end"],
  });
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
