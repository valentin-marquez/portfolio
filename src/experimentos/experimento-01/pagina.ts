// La página /experimento-01: la escena a pantalla completa, controles mínimos y el reloj que la
// mueve. Con ?captura queda quieta en 1440×1440 para las herramientas de revisión.
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "./pagina.css";
import { crearControlAudio } from "@/audio/control";
import { accionBotonSonido, volumenGuardado } from "./boton-sonido";
import { aPantalla, camaraEn, VISTA_CUADRADA } from "./camara";
import { ICONOS } from "./contenido/iconos";
import { formaEn } from "./forma";
import { type EventoSonido, sonidos, TRAMOS } from "./guion";
import { cargarFuentes, montar } from "./montar";
import { crearMotorCumbia } from "./motor-cumbia";
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
  let escena: ReturnType<typeof montar>;
  try {
    escena = montar(escenario);
  } catch {
    // sin WebGL2 (o sin GPU): un aviso en vez de una pantalla vacía; los controles siguen andando
    escenario.innerHTML =
      '<p class="sin-webgl">Este experimento necesita WebGL2, y este navegador no lo tiene.</p>';
    return { reloj: crearReloj(() => 0) };
  }
  const reloj = crearReloj(() => performance.now() / 1000);
  let pausadoPorVisitante = false;
  let motorActual: { suspender(): void; reanudar(): void } | null = null;

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
    // el audio se pausa con la animación: si no, al reanudar la animación saltaría a donde va el audio
    if (pausadoPorVisitante) {
      reloj.pausar();
      motorActual?.suspender();
    } else {
      reloj.reanudar();
      motorActual?.reanudar();
    }
    reproducir.textContent = pausadoPorVisitante ? "Reproducir" : "Pausar";
  });

  // ?t=3.2 congela ese instante (para revisar un estado en cualquier tamaño de pantalla)
  const fijo = new URLSearchParams(location.search).get("t");
  if (fijo !== null && Number.isFinite(Number(fijo))) {
    reloj.fijar(Number(fijo));
    reloj.pausar();
    pausadoPorVisitante = true;
  }

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

  // sonido: el mismo control del sitio (primer gesto, tecla M, pestaña oculta, preferencia guardada)
  const botonSonido = document.querySelector<HTMLButtonElement>(".sonido");
  const deslizador = document.querySelector<HTMLInputElement>(".deslizador");
  const CLAVE_VOLUMEN = "experimento-01:volumen";
  let volumen = volumenGuardado(
    (() => {
      try {
        return localStorage.getItem(CLAVE_VOLUMEN);
      } catch {
        return null;
      }
    })(),
  );
  let motorCumbia: ReturnType<typeof crearMotorCumbia> = null;
  const pintarVolumen = () => {
    if (!deslizador) return;
    deslizador.value = String(volumen);
    // el relleno del riel sigue al valor
    deslizador.style.setProperty("--v", `${volumen * 100}%`);
  };
  pintarVolumen();
  const pintarSonido = (activo: boolean) => {
    if (!botonSonido) return;
    const trazo =
      'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
    const ondas = activo
      ? `<path d="${ICONOS.onda1}" ${trazo}/><path d="${ICONOS.onda2}" ${trazo}/>`
      : `<path d="M16 9.5l5 5M21 9.5l-5 5" ${trazo}/>`;
    botonSonido.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ICONOS.parlante}" ${trazo}/>${ondas}</svg>`;
    botonSonido.setAttribute("aria-pressed", String(activo));
    botonSonido.setAttribute("aria-label", activo ? "Silenciar" : "Activar sonido");
  };
  const control = crearControlAudio({
    crearMotor: () => {
      const motor = crearMotorCumbia({
        url: "/audio/experimento-01.flac",
        desde: () => reloj.t(),
        volumen,
      });
      motorCumbia = motor;
      motorActual = motor;
      // con la animación pausada (menos movimiento o «Pausar»), el primer gesto no hace sonar nada
      if (motor && pausadoPorVisitante) queueMicrotask(() => motor.suspender());
      reloj.conectar(motor);
      return motor;
    },
    // la página siempre parte con sonido: no hereda el silencio que se haya puesto en la portada
    almacen: null,
    ventana: window,
    documento: document,
    alCambiar: () => pintarSonido(!control.silenciado),
  });
  let sonabaAlTocar = false;
  for (const ev of ["pointerdown", "keydown"] as const) {
    botonSonido?.addEventListener(ev, () => {
      sonabaAlTocar = control.activo && !control.silenciado;
    });
  }
  botonSonido?.addEventListener("click", () => {
    const accion = accionBotonSonido(sonabaAlTocar, control.silenciado);
    if (accion !== "nada") control.alternarSilencio();
    sonabaAlTocar = false;
  });
  deslizador?.addEventListener("input", () => {
    volumen = Number(deslizador.value);
    pintarVolumen();
    motorCumbia?.fijarVolumen(volumen);
    // mover el volumen es querer escuchar: si estaba silenciado, se activa
    if (control.silenciado && volumen > 0) control.alternarSilencio();
    try {
      localStorage.setItem(CLAVE_VOLUMEN, String(volumen));
    } catch {
      // sin almacenamiento, el volumen dura solo esta visita
    }
  });
  // el estado real del audio puede cambiar sin avisar (el navegador lo habilita tras un gesto)
  let pintado: boolean | null = null;
  const vigilar = () => {
    const activo = !control.silenciado;
    if (activo !== pintado) {
      pintado = activo;
      pintarSonido(activo);
    }
    requestAnimationFrame(vigilar);
  };
  requestAnimationFrame(vigilar);

  return { reloj };
}

const escenario = document.getElementById("escenario");
if (!escenario) throw new Error("falta #escenario");
if (new URLSearchParams(location.search).has("captura")) modoCaptura(escenario);
else modoPagina(escenario);
