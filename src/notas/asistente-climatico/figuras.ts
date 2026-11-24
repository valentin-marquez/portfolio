// Las figuras que se mueven de la nota del asistente climático. Siguen lo aprendido del glosario de
// ibelick: una idea por figura, caja de alto fijo, un solo botón que pasa a "Reiniciar", grises con un
// acento, y movimientos de 150 a 600 ms. Los recorridos en bucle van a 1,4 s por paso.
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GOLPE = "cubic-bezier(0.3, 1.5, 0.6, 1)";

const espera = (ms: number) => new Promise((r) => setTimeout(r, QUIETO ? 0 : ms));
const animar = (el: Element, cuadros: Keyframe[], ms: number, easing = GOLPE) =>
  el.animate(cuadros, { duration: QUIETO ? 0 : ms, easing }).finished;

/** lleva un elemento a otro contenedor y lo anima desde donde estaba */
async function mover(el: HTMLElement, destino: Element, ms = 420) {
  const a = el.getBoundingClientRect();
  destino.append(el);
  const b = el.getBoundingClientRect();
  await animar(
    el,
    [{ translate: `${a.left - b.left}px ${a.top - b.top}px` }, { translate: "0 0" }],
    ms,
  );
}
const sacudir = (el: Element) =>
  animar(
    el,
    [0, -7, 6, -4, 3, 0].map((x) => ({ translate: `${x}px 0` })),
    320,
    "ease-out",
  );
const botar = (el: Element) => animar(el, [{ scale: 1 }, { scale: 1.18 }, { scale: 1 }], 260);

function pieza<T extends Element>(raiz: Element, selector: string): T {
  const el = raiz.querySelector<T>(selector);
  if (!el) throw new Error(`falta ${selector} en la figura`);
  return el;
}

// ============ fig. 1: el modelo elige una herramienta ============
// nombres y argumentos tal como los recibe el modelo del asistente
const HERRAMIENTAS = [
  "proyeccion_climatica_comuna",
  "planes_regionales",
  "ley_marco",
  "documentos_del_portal",
  "sobre_este_sitio",
  "no_es_del_tema",
];
const PREGUNTAS = [
  {
    pregunta: "¿Cuánto va a subir la temperatura en Valdivia?",
    herramienta: 0,
    argumentos: 'comuna: "Valdivia", indicador: "temperatura_maxima"',
    fuente: "fuente: ARClim",
  },
  {
    pregunta: "¿Cada cuánto se actualizan los planes según la ley marco?",
    herramienta: 2,
    argumentos: 'buscar: "actualización de los planes"',
    fuente: "fuente: Ley 21.455",
  },
  {
    pregunta: "¿Dónde renuevo mi licencia de conducir?",
    herramienta: 5,
    argumentos: 'tipo: "tramites"',
    fuente: "respuesta fija: no es un tema del portal",
  },
  {
    pregunta: "plan climático de Los Ríos",
    herramienta: 1,
    argumentos: 'region: "Los Ríos"',
    fuente: "fuente: SNAICC",
  },
];

function figuraElegir(raiz: HTMLElement) {
  raiz.innerHTML = `
    <p class="pregunta"></p>
    <ul class="herramientas">${HERRAMIENTAS.map((h) => `<li>${h}</li>`).join("")}</ul>
    <p class="salida"><code></code><span class="fuente"></span></p>
    <button class="boton" type="button">Preguntar</button>`;
  const pregunta = pieza<HTMLElement>(raiz, ".pregunta");
  const fichas = [...raiz.querySelectorAll<HTMLElement>(".herramientas li")];
  const salida = pieza<HTMLElement>(raiz, ".salida");
  const llamada = pieza<HTMLElement>(salida, "code");
  const fuente = pieza<HTMLElement>(salida, ".fuente");
  const boton = pieza<HTMLButtonElement>(raiz, ".boton");
  let n = 0;
  pregunta.textContent = PREGUNTAS[0]?.pregunta ?? "";

  boton.addEventListener("click", async () => {
    const p = PREGUNTAS[n++ % PREGUNTAS.length];
    const elegida = p && fichas[p.herramienta];
    if (!p || !elegida) return;
    boton.disabled = true;
    salida.classList.remove("hecha");
    for (const f of fichas) f.className = "";
    pregunta.textContent = p.pregunta;
    await animar(
      pregunta,
      [
        { opacity: 0, translate: "0 8px" },
        { opacity: 1, translate: "0 0" },
      ],
      260,
    );
    await espera(250);
    // recorre la lista rápido al comienzo, cada vez más lento, y cae en la que corresponde
    const h = p.herramienta;
    const saltos = [3, 1, 4, 0, 5, 2, (h + 2) % 6, (h + 5) % 6, h];
    for (const [i, s] of saltos.entries()) {
      for (const f of fichas) f.classList.toggle("mira", f === fichas[s]);
      await espera(70 + i * 38);
    }
    await espera(180); // la pausa antes del golpe
    for (const f of fichas) f.className = f === elegida ? "elegida" : "apagada";
    await botar(elegida);
    llamada.textContent = `${HERRAMIENTAS[h]}(${p.argumentos})`;
    fuente.textContent = p.fuente;
    salida.classList.add("hecha");
    await animar(
      salida,
      [
        { opacity: 0, translate: "0 -6px" },
        { opacity: 1, translate: "0 0" },
      ],
      260,
    );
    boton.textContent = "Otra pregunta";
    boton.disabled = false;
  });
}

// ============ fig. 2: el camino completo, en bucle ============
const PASOS = ["Skills", "Preguntas", "Verificación", "Entrenamiento", "GGUF", "Evaluación"];

function figuraCamino(raiz: HTMLElement) {
  raiz.innerHTML = `<div class="camino">${PASOS.map((p) => `<span class="nodo">${p}</span>`).join('<i class="linea"></i>')}</div>`;
  if (QUIETO) return;
  const nodos = [...raiz.querySelectorAll(".nodo")];
  const lineas = [...raiz.querySelectorAll(".linea")];
  let i = -1;
  let reloj = 0;
  const paso = () => {
    i = (i + 1) % nodos.length;
    for (const [k, n] of nodos.entries()) n.classList.toggle("activa", k === i);
    for (const [k, l] of lineas.entries()) l.classList.toggle("pasa", k === i);
  };
  // solo corre mientras se ve
  new IntersectionObserver(([e]) => {
    clearInterval(reloj);
    if (!e?.isIntersecting) return;
    paso();
    reloj = window.setInterval(paso, 1400);
  }).observe(raiz);
}

// ============ fig. 3: cada pregunta se prueba contra la API ============
// [pregunta, registros que trae]; ilustrativos, el pie de la figura lo dice
const EJEMPLOS: [string, number][] = [
  ["clima en Rancagua", 1],
  ["planes de Atacama", 3],
  ["NDC de 2031", 0],
  ["ley marco, art. 40", 1],
  ["clima en Villa Inventada", 0],
  ["humedales", 4],
];

function figuraVerificar(raiz: HTMLElement) {
  const armar = () => {
    raiz.innerHTML = `
      <ul class="cola">${EJEMPLOS.map(([t, r]) => `<li data-r="${r}">${t}</li>`).join("")}</ul>
      <div class="puerta"><b>API pública</b><div class="ranura"></div><span class="lectura">en espera</span></div>
      <div class="destinos">
        <div class="pila si"><b>Entrenamiento <i>0</i></b><ul></ul></div>
        <div class="pila no"><b>Descartada <i>0</i></b><ul></ul></div>
      </div>
      <button class="boton" type="button">Verificar</button>`;
    pieza(raiz, ".boton").addEventListener("click", correr);
  };

  async function correr(e: Event) {
    const boton = e.currentTarget as HTMLButtonElement;
    if (boton.dataset.listo) return armar();
    boton.disabled = true;
    const puerta = pieza<HTMLElement>(raiz, ".puerta");
    const ranura = pieza(raiz, ".ranura");
    const lectura = pieza<HTMLElement>(raiz, ".lectura");
    for (const ficha of [...raiz.querySelectorAll<HTMLElement>(".cola li")]) {
      const registros = Number(ficha.dataset.r);
      await mover(ficha, ranura, 380);
      lectura.textContent = "consultando";
      puerta.classList.add("ocupada");
      await espera(420);
      lectura.textContent = registros === 1 ? "1 registro" : `${registros} registros`;
      puerta.classList.remove("ocupada");
      puerta.classList.add(registros ? "bien" : "mal");
      if (!registros) await sacudir(puerta);
      await espera(registros ? 220 : 120);
      const pila = pieza(raiz, registros ? ".pila.si" : ".pila.no");
      if (!registros) ficha.classList.add("tachada");
      await mover(ficha, pieza(pila, "ul"), 420);
      const cuenta = pieza<HTMLElement>(pila, "i");
      cuenta.textContent = String(Number(cuenta.textContent) + 1);
      botar(cuenta);
      puerta.classList.remove("bien", "mal");
    }
    lectura.textContent = "en espera";
    boton.textContent = "Reiniciar";
    boton.dataset.listo = "1";
    boton.disabled = false;
  }

  armar();
}

const FIGURAS: Record<string, (raiz: HTMLElement) => void> = {
  elegir: figuraElegir,
  camino: figuraCamino,
  verificar: figuraVerificar,
};
for (const raiz of document.querySelectorAll<HTMLElement>("[data-figura]")) {
  FIGURAS[raiz.dataset.figura ?? ""]?.(raiz);
}
