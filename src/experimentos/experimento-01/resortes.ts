// Resortes como funciones puras del tiempo. La física es la de Motion: su spring() devuelve un
// generador cuyo next(ms) no guarda estado, así que se puede muestrear en cualquier orden.
import { spring } from "motion";
import { D } from "./tiempo";

export interface Resorte {
  rigidez: number;
  amortiguacion: number;
}

/** la misma conversión que hace Motion con visualDuration + bounce, pero en claves físicas: así
 *  el resorte acepta velocidad inicial (Motion la ignora en los resortes definidos por duración) */
export function resorte(duracionVisual: number, rebote = 0): Resorte {
  const raiz = (2 * Math.PI) / (duracionVisual * 1.2);
  const rigidez = raiz * raiz;
  const amortiguacion = 2 * Math.min(1, Math.max(0.05, 1 - rebote)) * Math.sqrt(rigidez);
  return { rigidez, amortiguacion };
}

/** los resortes del experimento; ninguno sobreoscila más de ~1 % */
export const R = {
  /** salidas de contenido y presiones: críticamente amortiguado y rápido */
  salida: resorte(0.12),
  rapido: resorte(0.2, 0.1),
  firme: resorte(0.32, 0.15),
  suave: resorte(0.45, 0.1),
  camara: resorte(0.62, 0.05),
} as const;

type Generador = ReturnType<typeof spring>;
const generadores = new Map<string, Generador>();

function generador(r: Resorte, desde: number, hacia: number, velocidad: number): Generador {
  const clave = `${r.rigidez}|${r.amortiguacion}|${desde}|${hacia}|${velocidad}`;
  let g = generadores.get(clave);
  if (!g) {
    // umbrales de reposo casi nulos: con los de fábrica Motion salta al objetivo al final, y en una
    // pista de cientos de px ese salto se ve
    g = spring({
      keyframes: [desde, hacia],
      stiffness: r.rigidez,
      damping: r.amortiguacion,
      mass: 1,
      velocity: velocidad,
      restDelta: 1e-9,
      restSpeed: 1e-9,
    });
    generadores.set(clave, g);
  }
  return g;
}

/** valor del resorte que sale de `desde` con `velocidad` (unidades/s) hacia `hacia`, tau s después */
export function respuesta(
  tau: number,
  r: Resorte,
  desde: number,
  hacia: number,
  velocidad = 0,
): number {
  if (tau <= 0) return desde;
  return generador(r, desde, hacia, velocidad).next(tau * 1000).value;
}

/** respuesta de paso normalizada: 0 antes del cambio, tiende a 1 */
export function paso(tau: number, r: Resorte): number {
  return respuesta(tau, r, 0, 1);
}

/** derivada numérica centrada */
export function velocidad(f: (t: number) => number, t: number, h = 1e-4): number {
  return (f(t + h) - f(t - h)) / (2 * h);
}

/** el objetivo pasa a `a` en el instante t (s) */
export interface Cambio {
  t: number;
  a: number;
  r: Resorte;
}

/** manipulación directa entre t0 y t1: el valor sale de `valor(t)`. Al soltar, un resorte lo lleva
 *  hacia `a` desde el valor y la velocidad de ese instante */
export interface Arrastre {
  t0: number;
  t1: number;
  valor: (t: number) => number;
  a: number;
  r: Resorte;
}

export type EventoPista = Cambio | Arrastre;

const esArrastre = (e: EventoPista): e is Arrastre => "t0" in e;
const inicio = (e: EventoPista) => (esArrastre(e) ? e.t0 : e.t);

interface Salto {
  t: number;
  delta: number;
  r: Resorte;
}

interface Suelta {
  arrastre: Arrastre;
  x: number;
  v: number;
  saltos: Salto[];
}

function validar(e: EventoPista) {
  for (const t of esArrastre(e) ? [e.t0, e.t1] : [e.t]) {
    if (!(t >= 0 && t < D))
      throw new Error(`evento fuera del loop: ${t} s (debe estar en [0, ${D}))`);
  }
}

/**
 * Una propiedad animada como función pura y periódica del tiempo. Cada cambio suma un resorte
 * (Δ · paso). Los resortes que siguen moviéndose al cerrar el ciclo también se cuentan al comienzo,
 * así el valor y la velocidad coinciden en 0 y en D.
 */
export function pista(inicial: number, eventos: readonly EventoPista[]): (t: number) => number {
  const orden = [...eventos].sort((x, y) => inicio(x) - inicio(y));
  const antes: Salto[] = [];
  const sueltas: Suelta[] = [];
  let objetivo = inicial;
  for (const e of orden) {
    validar(e);
    const previa = sueltas.at(-1);
    if (esArrastre(e)) {
      const h = 1e-3;
      const x = e.valor(e.t1);
      sueltas.push({ arrastre: e, x, v: (x - e.valor(e.t1 - h)) / h, saltos: [] });
    } else {
      if (previa && e.t < previa.arrastre.t1) {
        throw new Error(`el cambio de ${e.t} s cae dentro de un arrastre`);
      }
      (previa ? previa.saltos : antes).push({ t: e.t, delta: e.a - objetivo, r: e.r });
    }
    objetivo = e.a;
  }
  if (Math.abs(objetivo - inicial) > 1e-9) {
    throw new Error(`la pista termina en ${objetivo} y empieza en ${inicial}: el loop no cierra`);
  }
  // los cambios que vienen después del último arrastre siguen asentándose al empezar el ciclo
  const cola = sueltas.at(-1)?.saltos ?? antes;

  return (t) => {
    let ultima: Suelta | undefined;
    for (const s of sueltas) if (s.arrastre.t0 <= t) ultima = s;
    if (ultima) {
      const a = ultima.arrastre;
      if (t <= a.t1) return a.valor(t);
      let v = respuesta(t - a.t1, a.r, ultima.x, a.a, ultima.v);
      for (const s of ultima.saltos) v += s.delta * paso(t - s.t, s.r);
      return v;
    }
    let v = inicial;
    for (const s of antes) v += s.delta * paso(t - s.t, s.r);
    for (const s of cola) v += s.delta * (paso(t - s.t + D, s.r) - 1);
    return v;
  };
}

/** una pista cuyo valor inicial es el último objetivo del ciclo (lo normal en un loop) */
export function pistaCiclica(eventos: readonly EventoPista[], siVacia = 0): (t: number) => number {
  const ultimo = [...eventos].sort((x, y) => inicio(x) - inicio(y)).at(-1);
  if (!ultimo) return () => siVacia;
  return pista(ultimo.a, eventos);
}
