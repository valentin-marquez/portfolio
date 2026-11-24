// Lo que comparten todas las notas: la tarjeta de los términos, el índice que marca la sección que se
// lee y las barras que crecen al entrar en pantalla.
import { esTermino, GLOSARIO } from "./glosario";

// ============ términos ============
const tarjeta = document.createElement("div");
tarjeta.className = "tarjeta-termino";
tarjeta.id = "tarjeta-termino";
tarjeta.setAttribute("role", "tooltip");
document.body.append(tarjeta);
let abierto: HTMLElement | null = null;

function parrafo(texto: string, clase?: string) {
  const p = document.createElement("p");
  p.textContent = texto;
  if (clase) p.className = clase;
  return p;
}

function abrir(el: HTMLElement) {
  const clave = el.dataset.t;
  if (!esTermino(clave)) return;
  const { nombre, que } = GLOSARIO[clave];
  const titulo = document.createElement("b");
  titulo.textContent = nombre;
  tarjeta.replaceChildren(titulo, parrafo(que));
  if (el.dataset.uso) tarjeta.append(parrafo(el.dataset.uso, "uso"));
  const r = el.getBoundingClientRect();
  const izquierda = Math.max(16, Math.min(r.left, innerWidth - tarjeta.offsetWidth - 16));
  tarjeta.style.left = `${izquierda + scrollX}px`;
  tarjeta.style.top = `${r.bottom + scrollY + 8}px`;
  tarjeta.classList.add("abierta");
  abierto?.removeAttribute("aria-describedby");
  el.setAttribute("aria-describedby", tarjeta.id);
  abierto = el;
}

function cerrar() {
  tarjeta.classList.remove("abierta");
  abierto?.removeAttribute("aria-describedby");
  abierto = null;
}

for (const el of document.querySelectorAll<HTMLElement>(".termino")) {
  // el mouse abre al pasar; el dedo y el teclado, al tocar o enfocar
  el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && abrir(el));
  el.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && cerrar());
  el.addEventListener("focus", () => abrir(el));
  el.addEventListener("blur", cerrar);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    // un segundo toque cierra; Enter (detail 0) y el clic del mouse, que ya la abrió al pasar, la dejan abierta
    const toque = e.detail > 0 && (e as PointerEvent).pointerType !== "mouse";
    if (abierto === el && toque) cerrar();
    else abrir(el);
  });
}
addEventListener("keydown", (e) => e.key === "Escape" && cerrar());
addEventListener("click", cerrar);
addEventListener("resize", cerrar);

// ============ índice ============
const enlaces = new Map(
  [...document.querySelectorAll<HTMLAnchorElement>(".indice a")].map((a) => [a.hash.slice(1), a]),
);
const lectura = new IntersectionObserver(
  (entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      for (const a of enlaces.values()) a.classList.remove("activa");
      enlaces.get(e.target.id)?.classList.add("activa");
    }
  },
  // la sección activa es la que cruza la franja entre el 20 % y el 30 % de la pantalla
  { rootMargin: "-20% 0px -70% 0px" },
);
for (const s of document.querySelectorAll("section[id]")) lectura.observe(s);

// ============ barras ============
const alVer = new IntersectionObserver(
  (entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("visto");
      alVer.unobserve(e.target);
    }
  },
  { threshold: 0.6 },
);
for (const b of document.querySelectorAll(".barras")) alVer.observe(b);
