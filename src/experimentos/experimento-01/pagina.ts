// La página /experimento-01: la escena a pantalla completa, controles mínimos y el reloj que la
// mueve. Con ?captura queda quieta en 1440×1440 para las herramientas de revisión.
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "./pagina.css";
import { aPantalla, camaraEn, VISTA_CUADRADA } from "./camara";
import { formaEn } from "./forma";
import { type EventoSonido, sonidos, TRAMOS } from "./guion";
import { cargarFuentes, montar } from "./montar";
import { crearReloj } from "./reloj";
import { CUADRO_FIJO, P } from "./tiempo";
import { en } from "./util";

declare global {
  interface Window {
    seek?: (t: number) => void;
    listo?: Promise<true>;
    eventos?: EventoSonido[];
    pulso?: number;
    cajaEnPantalla?: (t: number) => { x: number; y: number; w: number; h: number };
    revision?: { estado: string; t: number }[];
  }
}

function modoCaptura(escenario: HTMLElement) {
  document.documentElement.classList.add("captura");
  const escena = montar(escenario, { cuadrada: true });
  window.seek = escena.seek;
  window.eventos = sonidos();
  window.pulso = P;
  window.cajaEnPantalla = (t) => {
    const f = formaEn(t);
    const c = camaraEn(t);
    const [x, y] = aPantalla(c, VISTA_CUADRADA, f.cx - f.w / 2, f.cy - f.h / 2);
    return { x, y, w: f.w * c.zoom, h: f.h * c.zoom };
  };
  // un instante tranquilo por estado: a 70 % del tramo, cuando ya entró todo
  window.revision = TRAMOS.slice(1, -1).map((tr, i) => ({
    estado: tr.estado,
    t: tr.desde + 0.7 * (en(TRAMOS, i + 2).desde - tr.desde),
  }));
  window.listo = cargarFuentes().then(() => {
    escena.seek(0);
    return true as const;
  });
}

function modoPagina(escenario: HTMLElement) {
  const escena = montar(escenario);
  const reloj = crearReloj(() => performance.now() / 1000);
  let pausadoPorVisitante = false;

  // menos movimiento: un cuadro fijo y un botón para reproducir si se quiere
  const reproducir = document.querySelector<HTMLButtonElement>(".reproducir");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reloj.fijar(CUADRO_FIJO);
    reloj.pausar();
    pausadoPorVisitante = true;
    if (reproducir) reproducir.hidden = false;
  }
  reproducir?.addEventListener("click", () => {
    pausadoPorVisitante = !reloj.pausado;
    if (pausadoPorVisitante) reloj.pausar();
    else reloj.reanudar();
    reproducir.textContent = pausadoPorVisitante ? "Reproducir" : "Pausar";
  });

  const cuadro = () => {
    escena.seek(reloj.t());
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);

  // con la pestaña oculta el tiempo se detiene, y al volver sigue desde el mismo cuadro
  document.addEventListener("visibilitychange", () => {
    if (pausadoPorVisitante) return;
    if (document.hidden) reloj.pausar();
    else reloj.reanudar();
  });

  // volver: con el historial si se llegó desde el sitio (conserva el scroll), si no a la portada
  const desdeElSitio = () => {
    try {
      return document.referrer !== "" && new URL(document.referrer).origin === location.origin;
    } catch {
      return false;
    }
  };
  document.querySelector<HTMLAnchorElement>(".volver")?.addEventListener("click", (ev) => {
    if (!desdeElSitio()) return;
    ev.preventDefault();
    history.back();
  });
  addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (desdeElSitio()) history.back();
    else location.href = "/#experimentos";
  });

  let quieto = 0;
  const alMover = () => {
    document.body.classList.remove("puntero-oculto");
    clearTimeout(quieto);
    quieto = window.setTimeout(() => document.body.classList.add("puntero-oculto"), 1500);
  };
  addEventListener("pointermove", alMover);
  alMover();

  return { reloj };
}

const escenario = document.getElementById("escenario");
if (!escenario) throw new Error("falta #escenario");
if (new URLSearchParams(location.search).has("captura")) modoCaptura(escenario);
else modoPagina(escenario);
