import { useEffect } from "react";
import { crearMotorSonido } from "./audio/ambiente";
import { type Almacen, crearControlAudio } from "./audio/control";
import { calcularProgreso, escena, vientoDelLatido } from "./estado/escena";
import { pasoTiempo, rafagaDelPrado } from "./prado/motor";
import { influenciaScroll } from "./prado/viento";
import { CapaSemillas } from "./secciones/capa-semillas";
import { Cierre } from "./secciones/cierre";
import { Experimentos } from "./secciones/experimentos";
import { Hero } from "./secciones/hero";
import { Intro } from "./secciones/intro";
import { SobreMi } from "./secciones/sobre-mi";

function almacenLocal(): Almacen | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function App() {
  useEffect(() => {
    // scroll → progreso y velocidad; los prados reciben la velocidad y la acotan ellos mismos
    let yAnterior = window.scrollY;
    let tAnterior = performance.now();
    const alScroll = () => {
      const ahora = performance.now();
      const dt = Math.max(1, ahora - tAnterior);
      escena.velocidad = ((window.scrollY - yAnterior) / dt) * 1000;
      yAnterior = window.scrollY;
      tAnterior = ahora;
      escena.progreso = calcularProgreso(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      escena.pradoHero?.fijarScroll(escena.velocidad);
      escena.pradoCierre?.fijarScroll(escena.velocidad);
    };
    window.addEventListener("scroll", alScroll, { passive: true });
    alScroll();

    const audio = crearControlAudio({
      crearMotor: () => crearMotorSonido(),
      almacen: almacenLocal(),
      ventana: window,
      documento: document,
    });

    // latido: el mismo viento para las semillas y el audio
    let raf = 0;
    let anterior: number | null = null;
    let influencia = 0;
    const latido = (ahora: number) => {
      const dt = pasoTiempo(anterior, ahora);
      anterior = ahora;
      influencia = influenciaScroll(influencia, escena.velocidad, dt);
      escena.velocidad *= Math.exp(-dt * 4);
      escena.viento = vientoDelLatido(ahora, influencia);
      // el sonido cruza con la ola: mismo frente que ve el pasto
      audio.fijarViento(escena.viento, rafagaDelPrado(ahora).frente);
      raf = requestAnimationFrame(latido);
    };
    raf = requestAnimationFrame(latido);

    // panel de depuración: solo en desarrollo y con ?debug; en producción este bloque desaparece
    let vivo = true;
    let cerrarDepuracion: (() => void) | undefined;
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("debug")) {
      void import("./depuracion/panel").then(({ abrirDepuracion }) => {
        const cerrar = abrirDepuracion(escena.parametros);
        if (vivo) cerrarDepuracion = cerrar;
        else cerrar();
      });
    }

    return () => {
      vivo = false;
      cerrarDepuracion?.();
      window.removeEventListener("scroll", alScroll);
      cancelAnimationFrame(raf);
      audio.destruir();
    };
  }, []);

  return (
    <>
      <CapaSemillas />
      <main className="relative z-10">
        <Hero />
        <Intro />
        <Experimentos />
        <SobreMi />
        <Cierre />
      </main>
    </>
  );
}
