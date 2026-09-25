// Variante 2 · "Una sola pradera detrás": un único prado queda fijo detrás de todo; el contenido
// sube por encima como una hoja crema con los bordes en bruma y, al terminar, vuelves al mismo prado
// donde aterrizan las semillas. Mientras la hoja lo tapa entero, el prado no se dibuja.
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import { Aparecer } from "@/secciones/aparecer";
import { Experimentos } from "@/secciones/experimentos";
import { RelojSantiago } from "@/secciones/reloj-santiago";
import { SobreMi } from "@/secciones/sobre-mi";
import { Titulo } from "@/secciones/titulo";
import { VentanaPrado } from "@/secciones/ventana-prado";
import { zonaDescubierta } from "./coreografia";

const ANCHO = "min(1180px, calc(100% - 32px))";
/** alto de los bordes en bruma de la hoja, en fracción de la ventana */
const BRUMA = 0.3;
const CREMA = "246, 243, 234";

// el mismo prado es el del inicio y el del final: ahí despegan y ahí aterrizan las semillas
const alMontarPradera = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoHero = prado;
  escena.elHero = elemento;
  escena.pradoCierre = null;
  escena.elCierre = elemento;
};

export function VarianteDos() {
  const hoja = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  // forma de función: con rangos, Motion acelera la opacidad con la ScrollTimeline nativa y la
  // trata como "entrar y salir de la vista"
  const opacidadTitulo = useTransform(scrollY, (y) => 1 - Math.min(1, Math.max(0, y / 320)));
  const yTitulo = useTransform(scrollY, (y) => -40 * Math.min(1, Math.max(0, y / 320)));

  useEffect(() => {
    let descubierta: ReturnType<typeof zonaDescubierta> = null;
    const medir = () => {
      const prado = escena.elHero?.getBoundingClientRect();
      const r = hoja.current?.getBoundingClientRect();
      if (!prado || !r) return;
      const bruma = window.innerHeight * BRUMA;
      descubierta = zonaDescubierta(prado, { top: r.top + bruma, bottom: r.bottom - bruma });
      escena.pradoHero?.fijarEnPausa(descubierta === null);
    };
    escena.zonaAterrizaje = () => descubierta;
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    const primera = requestAnimationFrame(medir);
    return () => {
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
      cancelAnimationFrame(primera);
      escena.zonaAterrizaje = null;
    };
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-[6vh] z-0">
        <VentanaPrado
          alto="72vh"
          ancho={ANCHO}
          dientes={5}
          semilla={1}
          alMontar={alMontarPradera}
        />
      </div>
      <main className="relative z-10">
        <section aria-label="Valentín Márquez" className="relative h-screen">
          <motion.div
            style={{ opacity: opacidadTitulo, y: yTitulo }}
            className="absolute inset-x-0 bottom-[13vh]"
          >
            <Titulo />
          </motion.div>
        </section>

        <div ref={hoja}>
          <div
            aria-hidden="true"
            style={{
              height: `${BRUMA * 100}vh`,
              background: `linear-gradient(to bottom, rgba(${CREMA}, 0), rgb(${CREMA}))`,
            }}
          />
          <div className="bg-fondo pb-10">
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
          <div
            aria-hidden="true"
            style={{
              height: `${BRUMA * 100}vh`,
              background: `linear-gradient(to bottom, rgb(${CREMA}), rgba(${CREMA}, 0))`,
            }}
          />
        </div>

        <footer className="relative h-screen">
          <div className="absolute inset-x-0 bottom-[13vh]">
            <div className="mx-auto flex w-[560px] max-w-[calc(100%-32px)] items-baseline justify-between">
              <span className="text-enfasis">nos vemos</span>
              <RelojSantiago />
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
