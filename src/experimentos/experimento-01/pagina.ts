// Inspirado en «trans<form>er» de jhey (@jh3yy): https://x.com/jh3yy/status/2105011014781780028
// Así lo hizo él:
//   «es un <form> estándar con un poco de estilo
//    luego, al enviarlo, tomamos una instantánea del formulario y lo usamos como textura en three.js
//    con un diseño de robot procedural y webaudio
//    ¡para transformarlo de vuelta, reprodúcelo en reversa! 🤙»
// Acá el robot es el gólem de hierro de Minecraft, el formulario es un registro para la MineCon y,
// en vez de reversa, un flechazo lo deshace y la tarjeta se rearma con el «gracias».
import * as THREE from "three";
import "./formulario.css";
import { crearEscena } from "./escena";
import { TARJETA } from "./golem";
import { fijarEstado, incrustarImagenes, instantanea, leerCss } from "./instantanea";
import { conPlazo, descifrar, distanciaPara, escalaTarjeta, pasoReloj } from "./medidas";
import { crearRender, type Render } from "./render";
import { crearSonido, suena } from "./sonido";
import { azar, SWAP, tiempoReal, VUELVE_DOM } from "./tiempo";

declare global {
  interface Window {
    __pose?: (t: number) => void;
    __escena?: unknown;
  }
}

function $<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`falta ${selector} en experimento-01.html`);
  return el;
}
const registro = $<HTMLElement>("#registro");
const formulario = $<HTMLFormElement>("form.pedido");
const gracias = $<HTMLElement>(".gracias");
const cinta = $<HTMLElement>(".cinta");
const boton = $<HTMLButtonElement>(".pedido .notched");
const contenedor = $<HTMLElement>("#escena");
const destello = $<HTMLElement>("#destello");
const anuncio = $<HTMLElement>("#anuncio");
const botonSonido = $<HTMLButtonElement>("#sonido");
const otra = $<HTMLButtonElement>(".otra");

const CINTA = "Only a few spots left!";
const params = new URLSearchParams(location.search);
const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FIN_DOM = tiempoReal(VUELVE_DOM);

// ============ la tarjeta en pantalla ============
function ajustarTarjeta() {
  // la caja sin escalar: la escala (CSS scale) no cambia offsetHeight
  const { clientWidth, clientHeight } = document.documentElement;
  registro.style.setProperty(
    "--escala",
    String(escalaTarjeta(480, registro.offsetHeight, clientWidth, clientHeight)),
  );
}
const fuentes = document.fonts.ready.then(() => {
  // la tarjeta de gracias mide lo mismo que el formulario, sin la escala de pantallas chicas (que
  // puede haberse aplicado antes de que carguen las fuentes)
  const escala = Number(registro.style.getPropertyValue("--escala")) || 1;
  registro.style.setProperty(
    "--alto-tarjeta",
    `${formulario.getBoundingClientRect().height / escala}px`,
  );
  ajustarTarjeta();
});

// el CSS con las fuentes incrustadas, una sola vez: al enviar ya está listo
const css = fuentes.then(leerCss);

// ============ la escena: se arma al cargar, así el cambio al canvas no se traba ============
const cargador = new THREE.TextureLoader();
function pixelada(url: string) {
  const t = cargador.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}
const e = crearEscena(
  {
    hierro: pixelada("/recursos/experimento-01/iron_golem.png"),
    amapola: pixelada("/recursos/experimento-01/amapola.png"),
    flecha: pixelada("/recursos/experimento-01/flecha.png"),
    formulario: new THREE.Texture(),
    gracias: new THREE.Texture(),
  },
  // en pantallas táctiles, la sombra redonda de Minecraft en vez de sombras proyectadas (90 % del costo)
  { sombras: matchMedia("(pointer: fine)").matches },
);
let render: Render | null = null;
try {
  render = crearRender(contenedor, e, destello, params.has("sin-webgl"));
  render.precompilar();
} catch {
  render = null; // sin WebGL2: la tarjeta de gracias aparece sin animación
}
contenedor.style.visibility = "hidden";

// ============ sonido ============
const almacen = (() => {
  try {
    return localStorage;
  } catch {
    return null;
  }
})();
const sonido = crearSonido(almacen, suena(e.paneles.map((x) => x.vuelta[1])));
function mostrarSonido() {
  const apagado = sonido.silenciado();
  botonSonido.textContent = apagado ? "Sound off" : "Sound on";
  // para lectores de pantalla el nombre no cambia: el estado lo dice aria-pressed
  botonSonido.setAttribute("aria-label", "Sound");
  botonSonido.setAttribute("aria-pressed", String(!apagado));
}
botonSonido.addEventListener("click", () => {
  sonido.alternar();
  mostrarSonido();
});
mostrarSonido();

// ============ los datos y las instantáneas ============
type Datos = { jugador: string; correo: string; pase: string; numero: string };
function leerDatos(): Datos {
  const f = new FormData(formulario);
  const correo = String(f.get("correo") ?? "");
  const r = azar(correo.length * 7919 + String(f.get("jugador")).length);
  return {
    jugador: String(f.get("jugador") ?? ""),
    correo,
    pase: f.get("pase") === "creador" ? "Creator pass" : "General pass",
    numero: `#${String(Math.floor(r() * 1e6)).padStart(6, "0")}`,
  };
}
function llenarGracias(raiz: ParentNode, d: Datos) {
  const poner = (sel: string, texto: string) => {
    const el = raiz.querySelector(sel);
    if (el) el.textContent = texto;
  };
  poner("[data-jugador]", d.jugador);
  poner("[data-correo]", d.correo);
  poner("[data-pase]", d.pase);
  poner("[data-numero]", d.numero);
}
/** clona la tarjeta fuera de pantalla, la deja en el estado pedido y le saca la instantánea */
async function foto(css: Promise<string>, preparar: (clon: HTMLElement) => void) {
  const clon = registro.cloneNode(true) as HTMLElement;
  clon.style.removeProperty("--escala");
  clon.classList.remove("oculto");
  const caja = document.createElement("div");
  caja.style.cssText = "position:fixed;left:-10000px;top:0;width:480px";
  caja.append(clon);
  document.body.append(caja);
  try {
    preparar(clon);
    // sin ids repetidos en el documento mientras existe el clon (el CSS de la tarjeta usa clases)
    for (const el of [clon, ...clon.querySelectorAll("[id]")]) el.removeAttribute("id");
    await incrustarImagenes(clon);
    const lienzo = await instantanea(clon, await css, Math.min(devicePixelRatio, 2));
    const t = new THREE.CanvasTexture(lienzo);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  } finally {
    caja.remove();
  }
}
async function sacarFotos(d: Datos) {
  const [deFormulario, deGracias] = await Promise.all([
    foto(css, (clon) => {
      // el clon ya trae lo que se escribió (cloneNode copia value y checked); se fija en sus atributos
      // para que viaje en el HTML. El formulario de verdad no se toca: su reset() vuelve a vacío
      fijarEstado(clon);
      const c = clon.querySelector(".cinta");
      if (c) c.textContent = "Pass granted!";
      clon.querySelector(".notched")?.classList.remove("hundido");
    }),
    foto(css, (clon) => {
      clon.querySelector("form.pedido")?.setAttribute("hidden", "");
      clon.querySelector(".gracias")?.removeAttribute("hidden");
      const c = clon.querySelector(".cinta");
      if (c) c.textContent = "Registration complete!";
      llenarGracias(clon, d);
    }),
  ]);
  return { deFormulario, deGracias };
}

// ============ el encuadre: la tarjeta 3D calza con la del DOM ============
function encuadrar() {
  const r = registro.getBoundingClientRect();
  const alto = contenedor.clientHeight; // el mismo alto que usa el canvas
  const unidadesPorPx = TARJETA.ALTO / r.height;
  const desfase = (r.y + r.height / 2 - alto / 2) * unidadesPorPx;
  e.encuadrar(
    distanciaPara(r.height, alto, 30, TARJETA.ALTO),
    TARJETA.ELEVA + TARJETA.ALTO / 2 + desfase,
  );
}

// ============ estados de la página ============
let corriendo = false;
function mostrarGracias(d: Datos) {
  llenarGracias(gracias, d);
  formulario.hidden = true;
  gracias.hidden = false;
  cinta.textContent = "Registration complete!";
  boton.classList.remove("hundido");
  registro.classList.remove("oculto");
  contenedor.style.visibility = "hidden";
  anuncio.textContent = "Registration complete.";
  otra.focus();
  corriendo = false;
}
/** sin animación (movimiento reducido o sin WebGL2): un fundido corto a la tarjeta de gracias */
function sinAnimacion(d: Datos) {
  registro.classList.add("funde");
  registro.style.opacity = "0";
  setTimeout(() => {
    mostrarGracias(d);
    registro.style.opacity = "1";
  }, 200);
}
otra.addEventListener("click", () => {
  formulario.reset();
  gracias.hidden = true;
  formulario.hidden = false;
  cinta.textContent = CINTA;
  registro.style.removeProperty("opacity");
  $<HTMLInputElement>("#jugador").focus();
});

/** la cinta mientras reacciona el DOM (0 a SWAP): se revuelve, «Verifying player…», se revuelve, «Pass granted!» */
function textoCinta(t: number, r: () => number) {
  if (t < 0.16) return descifrar(CINTA, 1 - t / 0.16, r);
  if (t < 0.42) return descifrar("Verifying player…", (t - 0.16) / 0.1, r);
  return descifrar("Pass granted!", (t - 0.42) / 0.08, r);
}

async function transformar(d: Datos) {
  const r = azar(5);
  // si las instantáneas no llegan en 3 s (fuentes que no bajan, Safari), fundido directo al gracias
  const fotos = conPlazo(sacarFotos(d), 3000);
  let t = 0;
  let antes = performance.now();
  let enCanvas = false;
  sonido.sonar(-1, 0); // el clic
  boton.classList.add("hundido");
  const cuadro = async (ahora: number) => {
    const dt = pasoReloj(ahora, antes);
    antes = ahora;
    const previo = t;
    t = Math.min(FIN_DOM, t + dt);
    if (!enCanvas) {
      if (t < SWAP) {
        cinta.textContent = textoCinta(t, r);
        if (t > 0.42) boton.classList.remove("hundido");
      } else {
        t = SWAP; // espera a las instantáneas si todavía no están
        cinta.textContent = "Pass granted!";
        boton.classList.remove("hundido");
        const listas = await fotos;
        if (!listas || !render) return sinAnimacion(d);
        e.fijarFotos(listas.deFormulario, listas.deGracias);
        encuadrar();
        render.dibujar(SWAP);
        contenedor.style.visibility = "visible";
        registro.classList.add("oculto");
        enCanvas = true;
        antes = performance.now();
      }
    } else {
      render?.dibujar(t);
    }
    sonido.sonar(previo, t);
    if (t >= FIN_DOM) return mostrarGracias(d);
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

formulario.addEventListener("submit", (ev) => {
  ev.preventDefault();
  if (corriendo) return; // Enter o doble clic mientras corre: una sola transformación
  if (!formulario.reportValidity()) return;
  corriendo = true;
  anuncio.textContent = "Registering…";
  const d = leerDatos();
  if (reducido || !render) return sinAnimacion(d);
  void sonido.preparar().catch(() => {}); // por si no hubo gesto antes: el clic lo es
  void transformar(d);
});

// cualquier cambio de tamaño de la ventana (también el primero, al cargar en un teléfono): la tarjeta
// se reescala y, si está corriendo, el encuadre final vuelve a calzar con ella en su nueva posición
const tamano = new ResizeObserver(() => {
  ajustarTarjeta();
  render?.ajustar();
  if (corriendo) encuadrar();
});
tamano.observe(document.documentElement);
tamano.observe(contenedor);

// el audio se prepara con el primer gesto (escribir el nombre ya lo es): al apretar Register los
// sonidos están decodificados y el clic suena
for (const gesto of ["pointerdown", "keydown"])
  addEventListener(gesto, () => void sonido.preparar().catch(() => {}), {
    once: true,
    capture: true,
  });

// ============ revisión: ?t=6 congela ese instante (para las capturas del Playwright MCP) ============
if (params.has("t") && render) {
  const r0 = render;
  void fuentes.then(async () => {
    const jugador = $<HTMLInputElement>("#jugador");
    const correo = $<HTMLInputElement>("#correo");
    jugador.value = "nozz";
    correo.value = "valentin@nozz.skin";
    const listas = await sacarFotos(leerDatos());
    e.fijarFotos(listas.deFormulario, listas.deGracias);
    encuadrar();
    contenedor.style.visibility = "visible";
    registro.classList.add("oculto");
    window.__pose = (t: number) => r0.dibujar(t);
    window.__escena = e;
    r0.dibujar(Number(params.get("t")) || 0);
  });
}
