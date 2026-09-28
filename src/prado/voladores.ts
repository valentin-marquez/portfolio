// Mariposas y hojas. Son pocas, así que cada una se simula en la CPU con su propio carácter: las
// mariposas vagan con vuelo errático, se posan en los dientes de león y despegan si llega una ráfaga o
// se les acerca el puntero; las hojas caen meciéndose y girando, llevadas por el viento, y se quedan
// en el pasto hasta desaparecer. El motor solo dibuja lo que deja escrito escribirInstancias.
import { crearAzar } from "./azar";

export const FLOTANTES_POR_VOLADOR = 12;
export const MAX_VOLADORES = 16;

type Estado = "vuela" | "posada" | "cae";

export interface Volador {
  tipo: 0 | 1;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rumbo: number;
  cabeceo: number;
  alabeo: number;
  aleteo: number;
  fase: number;
  /** fases propias del vuelo errático */
  f1: number;
  f2: number;
  f3: number;
  variante: number;
  escala: number;
  alfa: number;
  estado: Estado;
  /** segundos hasta cambiar de rumbo o despegar */
  cambio: number;
  ox: number;
  oy: number;
  oz: number;
  /** flor hacia la que va o donde está posada; -1 ninguna */
  flor: number;
  /** sobra: se va por un costado */
  sale: boolean;
  /** hace poco se asustó: vuela más rápido */
  susto: number;
}

export interface Vista {
  x: number;
  y: number;
  z: number;
  /** medio ancho del cuadro a 1 m de la cámara: tan(fov / 2) · aspecto */
  medioAncho: number;
  /** entre qué distancias de la cámara vuelan (m): donde el foco las deja ver */
  cerca?: number;
  lejos?: number;
}

export interface Entorno {
  dt: number;
  /** fuerza de la ráfaga que pasa (0..1) y hacia dónde sopla */
  rafaga: number;
  sentido: 1 | -1;
  /** dónde puede posarse una mariposa: arriba de cada cabeza de diente de león */
  flores: ReadonlyArray<{ x: number; y: number; z: number }>;
  /** dónde toca el puntero el pasto, o null */
  puntero: { x: number; z: number } | null;
  vista: Vista;
  /** cuántas de cada una deberían estar ahora */
  mariposas: number;
  hojas: number;
  /** especies de mariposa que tocan en esta estación */
  especies: readonly number[];
}

export interface Enjambre {
  voladores: Volador[];
  azar: () => number;
  /** segundos desde que nació: al principio las mariposas ya están, después llegan por los costados */
  edad: number;
  /** espera antes de soltar la próxima hoja, para que no caigan en tandas */
  esperaHoja: number;
}

const CERCA = 2.4;
const LEJOS = 7;
const PISO = 0.35;

export function crearEnjambre(semilla: number): Enjambre {
  return { voladores: [], azar: crearAzar(semilla * 7919 + 17), edad: 0, esperaHoja: 0 };
}

const techo = (v: Vista) => Math.min(1.3, v.y * 1.2);
const medio = (v: Vista, distancia: number) => v.medioAncho * distancia * 0.85;

const cercaDe = (v: Vista) => v.cerca ?? CERCA;
const lejosDe = (v: Vista) => v.lejos ?? LEJOS;

function puntoAlAzar(e: Enjambre, v: Vista) {
  const d = cercaDe(v) + (lejosDe(v) - cercaDe(v)) * e.azar() ** 1.3;
  return {
    x: v.x + (e.azar() * 2 - 1) * medio(v, d),
    y: PISO + 0.05 + e.azar() * (techo(v) - PISO - 0.05),
    z: v.z - d,
  };
}

function nuevo(e: Enjambre, tipo: 0 | 1): Volador {
  const a = e.azar;
  return {
    tipo,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rumbo: a() * Math.PI * 2,
    cabeceo: 0,
    alabeo: 0,
    aleteo: 0,
    fase: a() * Math.PI * 2,
    f1: a() * 10,
    f2: a() * 10,
    f3: a() * 10,
    variante: 0,
    escala: 1,
    alfa: 1,
    estado: tipo === 0 ? "vuela" : "cae",
    cambio: 2 + a() * 3,
    ox: 0,
    oy: 0,
    oz: 0,
    flor: -1,
    sale: false,
    susto: 0,
  };
}

function elegirObjetivo(e: Enjambre, m: Volador, en: Entorno) {
  const ocupadas = new Set(e.voladores.filter((o) => o !== m && o.flor >= 0).map((o) => o.flor));
  const libres = en.flores.map((_, i) => i).filter((i) => !ocupadas.has(i));
  const flor =
    libres.length > 0 && e.azar() < 0.4 ? libres[Math.floor(e.azar() * libres.length)] : -1;
  const f = flor !== undefined && flor >= 0 ? en.flores[flor] : undefined;
  if (f) {
    m.flor = flor as number;
    m.ox = f.x;
    m.oy = f.y;
    m.oz = f.z;
  } else {
    m.flor = -1;
    const p = puntoAlAzar(e, en.vista);
    m.ox = p.x;
    m.oy = p.y;
    m.oz = p.z;
  }
  m.cambio = 3 + e.azar() * 4;
}

function soltarMariposa(e: Enjambre, en: Entorno) {
  const m = nuevo(e, 0);
  const v = en.vista;
  const especies = en.especies.length > 0 ? en.especies : [0];
  m.variante = especies[Math.floor(e.azar() * especies.length)] ?? 0;
  // la azulita es chica
  m.escala = (m.variante === 3 ? 0.1 : 0.13) + e.azar() * 0.03;
  const p = puntoAlAzar(e, v);
  if (e.edad < 1.5) {
    // al llegar a la página ya están ahí: aparecen en su lugar
    Object.assign(m, p);
    m.alfa = 0;
  } else {
    // después llegan volando desde un costado
    const lado = e.azar() < 0.5 ? -1 : 1;
    const d = v.z - p.z;
    m.x = v.x + lado * (medio(v, d) + 0.5);
    m.y = p.y;
    m.z = p.z;
  }
  elegirObjetivo(e, m, en);
  e.voladores.push(m);
}

function soltarHoja(e: Enjambre, en: Entorno) {
  const h = nuevo(e, 1);
  const v = en.vista;
  const d = cercaDe(v) + (lejosDe(v) - cercaDe(v)) * e.azar() ** 1.2;
  // nace arriba del cuadro y del lado desde donde sopla, así cruza al caer
  h.x = v.x + (e.azar() * 2 - 1) * medio(v, d) * 1.1 - en.sentido * 0.8;
  h.y = v.y + d * 0.3 + 0.25;
  h.z = v.z - d;
  h.variante = Math.floor(e.azar() * 4);
  h.escala = 0.09 + e.azar() * 0.05;
  h.cabeceo = e.azar() * 2 - 1;
  e.voladores.push(h);
}

const acercar = (actual: number, objetivo: number, tasa: number, dt: number) =>
  actual + (objetivo - actual) * (1 - Math.exp(-tasa * dt));

function volar(e: Enjambre, m: Volador, en: Entorno) {
  const { dt } = en;
  const v = en.vista;
  m.fase += dt * Math.PI * 2 * 7.5;
  m.f1 += dt;
  m.susto = Math.max(0, m.susto - dt);
  m.cambio -= dt;

  if (m.sale) {
    // se va por el costado más cercano
    const lado = m.x >= v.x ? 1 : -1;
    m.ox = v.x + lado * (medio(v, v.z - m.z) + 1.5);
    m.oy = m.y;
    m.oz = m.z;
  } else if (m.cambio <= 0) {
    elegirObjetivo(e, m, en);
  }

  // el puntero la espanta
  if (en.puntero && Math.hypot(m.x - en.puntero.x, m.z - en.puntero.z) < 0.6 && m.susto <= 0) {
    const dx = m.x - en.puntero.x || 0.1;
    const dz = m.z - en.puntero.z || 0.1;
    const l = Math.hypot(dx, dz);
    m.ox = m.x + (dx / l) * 1.4;
    m.oz = Math.min(v.z - cercaDe(v), m.z + (dz / l) * 1.4);
    m.oy = Math.min(techo(v), m.y + 0.4);
    m.flor = -1;
    m.susto = 1.2;
    m.cambio = 2;
  }

  const dx = m.ox - m.x;
  const dy = m.oy - m.y;
  const dz = m.oz - m.z;
  const dist = Math.hypot(dx, dy, dz);

  // llegó a su flor: se posa
  if (m.flor >= 0 && dist < 0.05 && !m.sale) {
    m.estado = "posada";
    m.x = m.ox;
    m.y = m.oy;
    m.z = m.oz;
    m.vx = m.vy = m.vz = 0;
    m.cambio = 3 + e.azar() * 5;
    return;
  }
  if (m.flor < 0 && dist < 0.2 && !m.sale) elegirObjetivo(e, m, en);

  // cerca de la flor frena para posarse; lejos va a su paso con un vaivén errático
  const crucero = (0.5 + (m.variante === 2 ? 0.15 : 0)) * (m.susto > 0 ? 2 : 1);
  const rapidez = m.flor >= 0 ? Math.min(crucero, dist * 1.6 + 0.08) : crucero;
  const inv = dist > 1e-4 ? 1 / dist : 0;
  const erratico = m.flor >= 0 && dist < 0.4 ? 0.2 : 1;
  const wx = (Math.sin(m.f1 * 1.7 + m.f2) * 0.35 + Math.sin(m.f1 * 3.1 + m.f3) * 0.15) * erratico;
  const wy = Math.sin(m.f1 * 2.3 + m.f3) * 0.28 * erratico;
  const wz = Math.sin(m.f1 * 1.3 + m.f2 * 2) * 0.2 * erratico;
  m.vx = acercar(m.vx, dx * inv * rapidez + wx, 2.4, dt);
  m.vy = acercar(m.vy, dy * inv * rapidez + wy, 2.4, dt);
  m.vz = acercar(m.vz, dz * inv * rapidez + wz, 2.4, dt);
  // la ráfaga la arrastra
  m.vx += en.sentido * en.rafaga * 1.4 * dt;

  m.x += m.vx * dt;
  m.y += m.vy * dt;
  m.z += m.vz * dt;
  if (m.y < PISO) {
    m.y = PISO;
    m.vy = Math.abs(m.vy);
  }
  if (m.y > techo(v) + 0.3) m.vy -= dt;
  m.z = Math.min(m.z, v.z - cercaDe(v) * 0.7);

  const horizontal = Math.hypot(m.vx, m.vz);
  if (horizontal > 0.02) {
    const rumbo = Math.atan2(m.vx, m.vz);
    let giro = rumbo - m.rumbo;
    giro = Math.atan2(Math.sin(giro), Math.cos(giro));
    m.rumbo += giro * (1 - Math.exp(-dt * 6));
    m.alabeo = acercar(m.alabeo, Math.max(-0.5, Math.min(0.5, -giro * 1.5)), 5, dt);
  }
  m.cabeceo = acercar(m.cabeceo, -Math.atan2(m.vy, horizontal + 0.1) * 0.5 - 0.15, 5, dt);
  // aleteo: de apenas bajo la horizontal a casi juntas arriba
  m.aleteo = 0.45 + 0.85 * Math.sin(m.fase);
}

function posada(e: Enjambre, m: Volador, en: Entorno) {
  const { dt } = en;
  m.cambio -= dt;
  m.f1 += dt;
  // quieta, con las alas casi juntas; de vez en cuando las abre despacio
  m.aleteo = 1.25 - 1.15 * Math.max(0, Math.sin(m.f1 * 0.9 + m.f2)) ** 3;
  m.cabeceo = acercar(m.cabeceo, 0, 4, dt);
  m.alabeo = acercar(m.alabeo, 0, 4, dt);
  const cerca = en.puntero && Math.hypot(m.x - en.puntero.x, m.z - en.puntero.z) < 0.5;
  if (m.cambio <= 0 || en.rafaga > 0.45 || cerca || m.sale) {
    // despega hacia cualquier parte, lejos de la flor
    m.estado = "vuela";
    m.flor = -1;
    m.vy = 0.4;
    const p = puntoAlAzar(e, en.vista);
    m.ox = p.x;
    m.oy = p.y;
    m.oz = p.z;
    m.cambio = 3 + e.azar() * 3;
  }
}

function caer(h: Volador, en: Entorno) {
  const { dt } = en;
  if (h.y <= 0.12 + (h.variante % 2) * 0.12) {
    // quedó en el pasto: se apaga despacio
    h.alfa -= dt / 2.5;
    return;
  }
  h.fase += dt * (1.6 + h.variante * 0.25);
  h.vy = -(0.42 + h.variante * 0.05);
  h.vx = en.sentido * (0.12 + en.rafaga * 1.8) + Math.sin(h.fase) * 0.4;
  h.vz = Math.cos(h.fase * 0.7) * 0.15;
  h.x += h.vx * en.dt;
  h.y += h.vy * en.dt;
  h.z += h.vz * en.dt;
  h.alabeo += dt * (2 + h.variante * 0.8);
  h.cabeceo = Math.sin(h.fase) * 0.9;
}

export function avanzarEnjambre(e: Enjambre, en: Entorno): void {
  const dt = Math.min(Math.max(en.dt, 0), 0.05);
  const entorno = dt === en.dt ? en : { ...en, dt };
  e.edad += dt;

  const mariposas = e.voladores.filter((o) => o.tipo === 0 && !o.sale);
  const quiero = Math.round(en.mariposas);
  if (mariposas.length < quiero && e.voladores.length < MAX_VOLADORES) soltarMariposa(e, entorno);
  // si sobran, la que esté más a mano se va
  for (let i = quiero; i < mariposas.length; i++) {
    const m = mariposas[i];
    if (m) m.sale = true;
  }

  e.esperaHoja -= dt;
  const hojas = e.voladores.filter((o) => o.tipo === 1 && o.y > 0.3).length;
  if (hojas < Math.round(en.hojas) && e.esperaHoja <= 0 && e.voladores.length < MAX_VOLADORES) {
    soltarHoja(e, entorno);
    e.esperaHoja = 0.6 + e.azar() * 1.4;
  }

  for (const o of e.voladores) {
    if (o.tipo === 0) {
      if (!o.sale) o.alfa = Math.min(1, o.alfa + dt / 1.5);
      if (o.estado === "posada") posada(e, o, entorno);
      else volar(e, o, entorno);
    } else caer(o, entorno);
  }

  // fuera: las mariposas que salieron del cuadro y las hojas que ya se apagaron
  const v = en.vista;
  e.voladores = e.voladores.filter((o) => {
    if (o.tipo === 1) return o.alfa > 0;
    return !(o.sale && Math.abs(o.x - v.x) > medio(v, v.z - o.z) + 1.2);
  });
}

/** Escribe cada volador como instancia (posición, giros y tipo); devuelve cuántos hay. */
export function escribirInstancias(e: Enjambre, datos: Float32Array): number {
  let n = 0;
  for (const o of e.voladores) {
    if (n >= MAX_VOLADORES) break;
    const k = n * FLOTANTES_POR_VOLADOR;
    datos.set(
      [
        o.x,
        o.y,
        o.z,
        o.escala,
        o.rumbo,
        o.cabeceo,
        o.alabeo,
        o.aleteo,
        o.tipo,
        o.variante,
        o.alfa,
        0,
      ],
      k,
    );
    n++;
  }
  return n;
}
