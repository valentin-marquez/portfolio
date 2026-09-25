import { useEffect } from "react";
import { crearMotorSonido } from "./audio/ambiente";
import { type Almacen, crearControlAudio } from "./audio/control";
import { calcularProgreso, escena } from "./estado/escena";
import { pasoTiempo } from "./prado/motor";
import { influenciaScroll, intensidad } from "./prado/viento";
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
      escena.viento = intensidad(ahora / 1000, 0, influencia);
      audio.fijarViento(escena.viento);
      raf = requestAnimationFrame(latido);
    };
    raf = requestAnimationFrame(latido);

    return () => {
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
