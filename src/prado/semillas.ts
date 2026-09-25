import { crearAzar } from "./azar";

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
  origenes: Punto[];
  /** puntos de aterrizaje en el prado del cierre, px de viewport */
  destinos: Punto[];
  /** la ventana del prado del cierre, px de viewport: ahí las semillas pueden verse sobre la columna */
  zonaAterrizaje: Rect | null;
  /** prefers-reduced-motion: las semillas no viajan ni se mecen, solo cambia su opacidad */
  reducir: boolean;
}

export const DESPEGUE = 0.02;
export const ATERRIZAJE = 0.86;
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
    };
  });
}

const seguir = (actual: number, objetivo: number, tasa: number, dt: number) =>
  actual + (objetivo - actual) * (1 - Math.exp(-dt * tasa));

const dentroDe = (r: Rect | null, x: number, y: number) =>
  !!r && x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;

export function actualizarSemillas(semillas: Semilla[], e: Entorno): void {
  const fase = faseSegun(e.progreso);
  const zonas = zonasLaterales(e.ancho, e.columna);
  for (const s of semillas) {
    const origen = e.origenes[s.indice % Math.max(1, e.origenes.length)] ?? {
      x: e.ancho / 2,
      y: e.alto * 0.4,
    };
    if (s.fase === "reposo" && s.x === 0 && s.y === 0) {
      s.x = origen.x;
      s.y = origen.y;
    }
    const faseAnterior = s.fase;
    s.fase = fase;
    const deriva = e.reducir ? 0 : Math.sin(e.tiempo * 0.25 + s.fasePropia);
    let tx = origen.x;
    let ty = origen.y;
    let alfaObjetivo = 0;
    let tasa = 0.9;

    if (fase === "vuelo") {
      const zona = zonas[s.indice % Math.max(1, zonas.length)];
      if (zona) {
        tx = zona[0] + (zona[1] - zona[0]) * s.carril + deriva * 14;
        tx = Math.min(zona[1], Math.max(zona[0], tx));
        const vaiven = e.reducir ? 0 : Math.cos(e.tiempo * 0.2 + s.fasePropia) * 20;
        ty = e.alto * (0.12 + 0.76 * s.altura) + vaiven;
        alfaObjetivo = ALFA_VUELO * (1 - s.desenfoque * 0.5);
      } else {
        tx = s.x;
        ty = s.y;
      }
      tasa = 0.7 + e.viento * 0.6;
    } else if (fase === "aterrizaje") {
      const destino = e.destinos[s.indice % Math.max(1, e.destinos.length)] ?? {
        x: e.ancho / 2,
        y: e.alto * 0.8,
      };
      tx = destino.x + deriva * 6;
      ty = destino.y;
      alfaObjetivo = 0.8;
      tasa = 0.8;
    }

    if (e.reducir) {
      // sin viaje: la semilla aparece en su lugar; al cambiar de fase parte invisible y se funde
      if (faseAnterior !== fase) s.alfa = 0;
      s.x = tx;
      s.y = ty;
    } else {
      s.x = seguir(s.x, tx, tasa, e.dt);
      s.y = seguir(s.y, ty, tasa, e.dt);
    }

    // sobre la columna de texto solo puede verse dentro del prado del cierre; si no, se apaga rápido
    const sobreTexto =
      Math.abs(s.x - e.ancho / 2) < e.columna / 2 + HOLGURA &&
      !dentroDe(e.zonaAterrizaje, s.x, s.y);
    s.alfa = seguir(
      s.alfa,
      sobreTexto ? 0 : alfaObjetivo,
      sobreTexto ? FUNDIDO_RAPIDO : FUNDIDO,
      e.dt,
    );
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
