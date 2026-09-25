import { crearAzar } from "./azar";
import { suave } from "./viento";

export type Fase = "reposo" | "vuelo" | "aterrizaje";

export interface Semilla {
  x: number;
  y: number;
  fase: Fase;
  /** posición dentro de su zona lateral, 0..1 */
  carril: number;
  /** altura de vuelo, 0..1: repartida entre todas las semillas */
  altura: number;
  indice: number;
  fasePropia: number;
  tam: number;
  /** 0 nítida, 1 muy desenfocada */
  desenfoque: number;
  alfa: number;
  /** px/s */
  vx: number;
  vy: number;
  /** giro extra por los empujones del puntero, en radianes, y su velocidad */
  giro: number;
  vgiro: number;
  /** segundos desde que se soltó de su flor */
  vuelo: number;
  /** se soltó de su flor y todavía no vuelve a ella */
  afuera: boolean;
  /** tamaño en pantalla relativo a `tam`: sale del tamaño de su flor y crece al acercarse */
  escala: number;
}

export interface Punto {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Una cabeza de diente de león en pantalla; el radio es el de la cabeza, en px. */
export type Origen = Punto & { radio?: number };

/** El puntero en px de viewport, con su velocidad en px/s. */
export interface Puntero {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Una semilla que acaba de soltarse de su flor. */
export interface Desprendida {
  indice: number;
  origen: Punto;
  radio: number;
}

export interface Entorno {
  progreso: number;
  tiempo: number;
  dt: number;
  /** intensidad del viento 0..1 */
  viento: number;
  ancho: number;
  alto: number;
  /** ancho de la columna de texto, centrada */
  columna: number;
  /** puntas de los dientes de león del hero, px de viewport */
  origenes: Origen[];
  /** puntos de aterrizaje en el prado del cierre, px de viewport */
  destinos: Punto[];
  /** la ventana del prado del cierre, px de viewport: ahí las semillas pueden verse sobre la columna */
  zonaAterrizaje: Rect | null;
  /** la ventana del hero: ahí salen de las flores y también pueden verse sobre la columna */
  zonaSalida: Rect | null;
  /** el puntero, si está sobre la página: su gesto empuja las semillas */
  puntero: Puntero | null;
  /** hacia dónde sopla el viento en pantalla */
  sentido: 1 | -1;
  /** prefers-reduced-motion: las semillas no viajan ni se mecen, solo cambia su opacidad */
  reducir: boolean;
}

export const DESPEGUE = 0.02;
/** tramo del scroll en que se van soltando, de a una */
export const TRAMO_DESPEGUE = 0.1;
export const ATERRIZAJE = 0.86;
/** lo más que se deshace una flor por las semillas que se le van: pierde, pero no queda pelada */
export const MAXIMO_DESPRENDIDO = 0.4;
const RADIO_POR_DEFECTO = 12;
/** a esta distancia de su flor, la semilla que vuelve ya llegó */
const LLEGADA = 24;
/** resortes hacia su lugar, amortiguados en el punto crítico: se acercan sin pasarse */
const RESORTE_VUELO = 0.6;
const RESORTE_REGRESO = 0.8;
const RESORTE_ATERRIZAJE = 1.5;
const VELOCIDAD_MAXIMA = 900;
/** hasta dónde llega el aire que mueve la mano, y cuánto empuja */
const RADIO_SOPLO = 70;
const GANANCIA_SOPLO = 7;
/** sin carril donde volar (pantalla angosta), se la lleva el viento y se pierde al rato */
const VIDA_SIN_CARRIL = 2;
const HOLGURA = 24;
const BORDE = 16;
const ZONA_MINIMA = 48;
const ALFA_VUELO = 0.55;
const FUNDIDO = 1.5;
const FUNDIDO_RAPIDO = 14;

export function faseSegun(progreso: number): Fase {
  if (progreso < DESPEGUE) return "reposo";
  if (progreso >= ATERRIZAJE) return "aterrizaje";
  return "vuelo";
}

/** En qué punto del scroll se suelta cada semilla: de a una, a lo largo del primer tramo. */
export function umbralDespegue(indice: number, n: number): number {
  return DESPEGUE + (n > 1 ? indice / (n - 1) : 0) * TRAMO_DESPEGUE;
}

function faseDe(indice: number, n: number, progreso: number): Fase {
  if (progreso >= ATERRIZAJE) return "aterrizaje";
  return progreso < umbralDespegue(indice, n) ? "reposo" : "vuelo";
}

/** Intervalos de x donde una semilla puede volar sin quedar detrás del texto. */
export function zonasLaterales(ancho: number, columna: number): Array<[number, number]> {
  const centro = ancho / 2;
  const izq: [number, number] = [BORDE, centro - columna / 2 - HOLGURA];
  const der: [number, number] = [centro + columna / 2 + HOLGURA, ancho - BORDE];
  return [izq, der].filter(([a, b]) => b - a >= ZONA_MINIMA);
}

export function crearSemillas(n: number, semilla: number): Semilla[] {
  const azar = crearAzar(semilla);
  return Array.from({ length: n }, (_, i) => {
    const desenfoque = azar() ** 2;
    return {
      x: 0,
      y: 0,
      fase: "reposo" as Fase,
      carril: 0.15 + azar() * 0.7,
      altura: (i + 0.5) / n,
      indice: i,
      fasePropia: azar() * Math.PI * 2,
      // más grandes que un punto: tienen que leerse como semillas, no como manchas
      tam: 14 + azar() * 8 + desenfoque * 12,
      desenfoque,
      alfa: 0,
      vx: 0,
      vy: 0,
      giro: 0,
      vgiro: 0,
      vuelo: 0,
      afuera: false,
      escala: 1,
    };
  });
}

const seguir = (actual: number, objetivo: number, tasa: number, dt: number) =>
  actual + (objetivo - actual) * (1 - Math.exp(-dt * tasa));

const dentroDe = (r: Rect | null, x: number, y: number) =>
  !!r && x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;

/**
 * Un paso de la simulación. Devuelve las semillas que se soltaron de su flor en este cuadro, para
 * que la flor se deshaga un poco y salgan unas sueltas con ella.
 */
export function actualizarSemillas(semillas: Semilla[], e: Entorno): Desprendida[] {
  const soltadas: Desprendida[] = [];
  const zonas = zonasLaterales(e.ancho, e.columna);
  const n = semillas.length;
  for (const s of semillas) {
    const origen = e.origenes[s.indice % Math.max(1, e.origenes.length)] ?? {
      x: e.ancho / 2,
      y: e.alto * 0.4,
    };
    const faseAnterior = s.fase;
    const fase = faseDe(s.indice, n, e.progreso);
    s.fase = fase;
    // mientras espera en su flor la sigue, invisible (la flor se mueve con el scroll)
    if (fase === "reposo" && !s.afuera) {
      s.x = origen.x;
      s.y = origen.y;
    }

    if (faseAnterior === "reposo" && fase !== "reposo") {
      const radio = origen.radio ?? RADIO_POR_DEFECTO;
      soltadas.push({ indice: s.indice, origen: { x: origen.x, y: origen.y }, radio });
      s.afuera = true;
      s.vuelo = 0;
      if (!e.reducir) {
        // parte de la cabeza misma, donde la flor pierde la semilla, y el viento se la lleva
        const angulo = s.fasePropia;
        s.x = origen.x + Math.cos(angulo) * radio * 0.4;
        s.y = origen.y + Math.sin(angulo) * radio * 0.4;
        s.vx = e.sentido * (90 + 110 * e.viento) + Math.cos(angulo) * 25;
        s.vy = -45 + Math.sin(angulo) * 20;
      }
    }
    if (fase !== "reposo") s.vuelo += e.dt;

    const deriva = e.reducir ? 0 : Math.sin(e.tiempo * 0.25 + s.fasePropia);
    const visibleEnVuelo = ALFA_VUELO * (1 - s.desenfoque * 0.5);
    let tx = origen.x;
    let ty = origen.y;
    let alfaObjetivo = 0;
    let resorte = RESORTE_REGRESO;
    let libre = false;

    if (fase === "vuelo") {
      const zona = zonas[s.indice % Math.max(1, zonas.length)];
      if (zona) {
        tx = zona[0] + (zona[1] - zona[0]) * s.carril + deriva * 14;
        tx = Math.min(zona[1], Math.max(zona[0], tx));
        const vaiven = e.reducir ? 0 : Math.cos(e.tiempo * 0.2 + s.fasePropia) * 20;
        ty = e.alto * (0.12 + 0.76 * s.altura) + vaiven;
        alfaObjetivo = visibleEnVuelo;
        resorte = RESORTE_VUELO;
      } else {
        tx = s.x;
        ty = s.y;
        libre = true;
        alfaObjetivo = s.vuelo < VIDA_SIN_CARRIL ? visibleEnVuelo : 0;
      }
    } else if (fase === "aterrizaje") {
      const destino = e.destinos[s.indice % Math.max(1, e.destinos.length)] ?? {
        x: e.ancho / 2,
        y: e.alto * 0.8,
      };
      tx = destino.x + deriva * 6;
      ty = destino.y;
      alfaObjetivo = 0.8;
      resorte = RESORTE_ATERRIZAJE;
    } else if (s.afuera) {
      // vuelve a su flor visible; se apaga al llegar, cuando la flor la recibe
      alfaObjetivo = Math.hypot(s.x - origen.x, s.y - origen.y) > LLEGADA ? visibleEnVuelo : 0;
    }

    if (e.reducir) {
      // sin viaje: la semilla aparece en su lugar; al cambiar de fase parte invisible y se funde
      if (faseAnterior !== fase) s.alfa = 0;
      s.x = tx;
      s.y = ty;
      s.vx = 0;
      s.vy = 0;
    } else {
      if (e.puntero && fase !== "reposo") soplar(s, e.puntero, e.dt);
      // recién suelta viaja con el viento; de a poco busca su lugar
      const rampa = fase === "reposo" ? 1 : suave(0.3, 1.6, s.vuelo);
      const k = libre ? 0 : resorte * rampa;
      const conViento = libre ? 1 : 1 - rampa;
      const wx = e.sentido * (40 + 120 * e.viento) * conViento;
      const wy = -18 * conViento;
      const amortiguacion = 2 * Math.sqrt(libre ? RESORTE_VUELO : resorte);
      s.vx += (k * (tx - s.x) - amortiguacion * (s.vx - wx)) * e.dt;
      s.vy += (k * (ty - s.y) - amortiguacion * (s.vy - wy)) * e.dt;
      const rapidez = Math.hypot(s.vx, s.vy);
      if (rapidez > VELOCIDAD_MAXIMA) {
        s.vx *= VELOCIDAD_MAXIMA / rapidez;
        s.vy *= VELOCIDAD_MAXIMA / rapidez;
      }
      s.x += s.vx * e.dt;
      s.y += s.vy * e.dt;
      s.vgiro *= Math.exp(-e.dt * 2);
      s.giro = (s.giro + s.vgiro * e.dt) * Math.exp(-e.dt * 0.8);
    }

    const aSuFlor = Math.hypot(s.x - origen.x, s.y - origen.y);
    if (fase === "reposo" && s.afuera && aSuFlor <= LLEGADA) s.afuera = false;
    // perspectiva: las flores del hero están lejos; la semilla sale de su tamaño y crece al venir
    // hacia la cámara, y al volver se achica hasta caber otra vez en su flor
    const chica = Math.min(1, ((origen.radio ?? RADIO_POR_DEFECTO) * 1.3) / s.tam);
    const cerca = e.reducir
      ? 1
      : fase === "reposo"
        ? suave(LLEGADA, 220, aSuFlor)
        : suave(0.1, 1.8, s.vuelo);
    s.escala = chica + (1 - chica) * cerca;

    // sobre la columna de texto solo puede verse dentro de los prados; fuera de pantalla, tampoco
    const sobreTexto =
      Math.abs(s.x - e.ancho / 2) < e.columna / 2 + HOLGURA &&
      !dentroDe(e.zonaAterrizaje, s.x, s.y) &&
      !dentroDe(e.zonaSalida, s.x, s.y);
    const fueraDePantalla = s.x < -20 || s.x > e.ancho + 20;
    const oculta = sobreTexto || fueraDePantalla;
    const recienSuelta = fase !== "reposo" && s.vuelo < 0.5;
    const tasa = oculta ? FUNDIDO_RAPIDO : recienSuelta ? 10 : fase === "reposo" ? 8 : FUNDIDO;
    s.alfa = seguir(s.alfa, oculta ? 0 : alfaObjetivo, tasa, e.dt);
  }
  return soltadas;
}

/** El aire que mueve la mano: empuja en la dirección del gesto, un poco hacia afuera, y la hace girar. */
function soplar(s: Semilla, p: Puntero, dt: number) {
  const dx = s.x - p.x;
  const dy = s.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d >= RADIO_SOPLO) return;
  const f = (1 - d / RADIO_SOPLO) ** 2;
  const rapidez = Math.hypot(p.vx, p.vy);
  const inv = d > 0.001 ? 1 / d : 0;
  s.vx += (p.vx + dx * inv * rapidez * 0.4) * f * GANANCIA_SOPLO * dt;
  s.vy += (p.vy + dy * inv * rapidez * 0.4) * f * GANANCIA_SOPLO * dt;
  s.vgiro += (p.vx * dy - p.vy * dx) * inv * f * 0.02 * dt;
}

/**
 * Cuánto se deshace cada flor del hero: en proporción a sus semillas que andan afuera, hasta
 * MAXIMO_DESPRENDIDO. Una semilla que vuelve cuenta como afuera hasta que llega.
 */
export function desprendimiento(
  semillas: Semilla[],
  origenes: ReadonlyArray<Punto>,
  reducir: boolean,
): number[] {
  const total = origenes.map(() => 0);
  const fuera = origenes.map(() => 0);
  if (reducir || origenes.length === 0) return total;
  for (const s of semillas) {
    const i = s.indice % origenes.length;
    total[i] = (total[i] ?? 0) + 1;
    if (s.fase !== "reposo" || s.afuera) fuera[i] = (fuera[i] ?? 0) + 1;
  }
  return total.map((t, i) => (t > 0 ? (MAXIMO_DESPRENDIDO * (fuera[i] ?? 0)) / t : 0));
}

/** La flor pierde sus semillas enseguida y se vuelve a llenar más despacio. */
export function suavizarDesprendimiento(
  actual: number[] | Float32Array,
  objetivo: ReadonlyArray<number>,
  dt: number,
): void {
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i] ?? 0;
    const o = objetivo[i] ?? 0;
    actual[i] = seguir(a, o, o > a ? 6 : 1.5, dt);
  }
}

/** Semilla grande y desenfocada que cruza por delante cada ~8 s, solo con el hero a la vista. */
export function semillaCercana(
  tiempo: number,
  progreso: number,
): { activa: boolean; x: number; y: number; alfa: number } {
  const periodo = 8;
  const k = (tiempo % periodo) / periodo;
  const cruce = 0.6; // fracción del periodo que dura el cruce
  if (progreso >= 0.1 || k > cruce) return { activa: false, x: 0, y: 0, alfa: 0 };
  const u = k / cruce;
  const ciclo = Math.floor(tiempo / periodo);
  return {
    activa: true,
    x: -0.1 + u * 1.2,
    y: 0.3 + 0.3 * Math.sin(ciclo * 1.7) + Math.sin(u * 6) * 0.04,
    // entra y sale fundiéndose: nunca aparece de golpe en el borde del hero
    alfa: 0.35 * Math.sin(Math.PI * u),
  };
}
