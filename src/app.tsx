import { useEffect } from "react";
import { crearMotorSonido } from "./audio/ambiente";
import { type Almacen, crearControlAudio } from "./audio/control";
import {
  cargarClimaDelVisitante,
  DESPEJADO,
  ESTACIONES,
  type Estacion,
  estacionEn,
  latitudProbable,
  TIEMPOS,
} from "./clima/clima";
import { calcularProgreso, escena, vientoDelLatido } from "./estado/escena";
import { atmosferaDe, atmosferaEn, fijarAtmosfera } from "./prado/atmosfera";
import { pasoTiempo, rafagaDelPrado } from "./prado/motor";
import { NIVELES, rendimiento } from "./prado/ritmo";
import { fijarClima, influenciaScroll } from "./prado/viento";
import { BordeDifuso } from "./secciones/borde-difuso";
import { CapaSemillas } from "./secciones/capa-semillas";
import { Cierre } from "./secciones/cierre";
import { Experimentos } from "./secciones/experimentos";
import { Hero } from "./secciones/hero";
import { Intro } from "./secciones/intro";
import { Medidor } from "./secciones/medidor";
import { SobreMi } from "./secciones/sobre-mi";
import { Trabajos } from "./secciones/trabajos";
import { Presentacion } from "./variantes/cuatro";
import { VarianteDos } from "./variantes/dos";
import { VarianteUno } from "./variantes/uno";

function almacenLocal(): Almacen | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function almacenDeSesion(): Almacen | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

// el viento real se pide una sola vez por carga (StrictMode monta los efectos dos veces en desarrollo)
let climaPedido = false;

// ?rendimiento muestra el medidor; ?nivel=2 fija un nivel de calidad para comparar en un teléfono
const consulta = new URLSearchParams(window.location.search);
const conMedidor = consulta.has("rendimiento");
const nivelPedido = Number.parseInt(consulta.get("nivel") ?? "", 10);
if (nivelPedido >= 0 && nivelPedido < NIVELES.length) rendimiento.nivel = nivelPedido;

/** ?tiempo=lluvia y ?estacion=otono muestran el prado así, sin importar el tiempo real */
function pedidoEnLaUrl() {
  const q = new URLSearchParams(window.location.search);
  const tiempo = TIEMPOS[q.get("tiempo") ?? ""];
  const estacion = q.get("estacion");
  return {
    tiempo,
    estacion: ESTACIONES.includes(estacion as Estacion) ? (estacion as Estacion) : undefined,
  };
}

/** mientras llega la ubicación: el hemisferio que delata el horario de verano del navegador */
function latitudSinUbicacion(): number {
  const anio = new Date().getFullYear();
  return latitudProbable(
    new Date(anio, 0, 1).getTimezoneOffset(),
    new Date(anio, 6, 1).getTimezoneOffset(),
  );
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

    // el tiempo real de la zona del visitante: su viento marca el ritmo y su cielo viste el prado;
    // si no llega, sigue la brisa por defecto en un día despejado de la estación que corresponda
    if (!climaPedido) {
      climaPedido = true;
      const pedido = pedidoEnLaUrl();
      fijarAtmosfera(
        atmosferaDe(
          pedido.tiempo ?? DESPEJADO,
          pedido.estacion ?? estacionEn(new Date(), latitudSinUbicacion()),
        ),
        performance.now() / 1000,
        0,
      );
      void cargarClimaDelVisitante({
        fetch: window.fetch.bind(window),
        almacen: almacenDeSesion(),
        ahora: () => Date.now(),
      }).then((lectura) => {
        if (!lectura) return;
        const t = performance.now() / 1000;
        fijarClima(lectura.viento, t);
        // el cielo real entra de a poco: se nubla o empieza a llover en unos segundos
        fijarAtmosfera(
          atmosferaDe(
            pedido.tiempo ?? lectura.tiempo,
            pedido.estacion ?? estacionEn(new Date(), lectura.latitud),
          ),
          t,
          6,
        );
      });
    }

    const audio = crearControlAudio({
      crearMotor: () => crearMotorSonido(),
      almacen: almacenLocal(),
      ventana: window,
      documento: document,
    });

    // el soplo de una flor también suena, paneado hacia donde está; va en una microtarea para que el
    // primer toque alcance a despertar el audio antes
    const sonarSoplo = (cabeza: { x: number }) =>
      queueMicrotask(() => audio.soplo((cabeza.x / window.innerWidth) * 2 - 1));
    escena.alSoplar.push(sonarSoplo);

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
      audio.fijarLluvia(atmosferaEn(ahora / 1000).tiempo.lluvia);
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
      escena.alSoplar = escena.alSoplar.filter((f) => f !== sonarSoplo);
      vivo = false;
      cerrarDepuracion?.();
      window.removeEventListener("scroll", alScroll);
      cancelAnimationFrame(raf);
      audio.destruir();
    };
  }, []);

  // mientras se elige la composición: /?v=1 y /?v=2 son las variantes; sin parámetro, la actual
  const variante = new URLSearchParams(window.location.search).get("v");
  return (
    <>
      <CapaSemillas />
      {conMedidor && <Medidor />}
      {variante === "4" ? (
        <Presentacion />
      ) : variante === "1" ? (
        <VarianteUno />
      ) : variante === "2" ? (
        <VarianteDos />
      ) : (
        <>
          <main className="relative z-10">
            <Hero />
            <Intro />
            <Trabajos />
            <Experimentos />
            <SobreMi />
            <Cierre />
          </main>
          <BordeDifuso lado="arriba" />
          <BordeDifuso lado="abajo" />
        </>
      )}
    </>
  );
}
