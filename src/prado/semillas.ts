import { crearAzar } from "./azar";

export type Fase = "reposo" | "vuelo" | "aterrizaje";

export interface Semilla {
  x: number;
  y: number;
  fase: Fase;
  /** posición dentro de su zona lateral, 0..1 */
  carril: number;
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
}

export const DESPEGUE = 0.02;
export const ATERRIZAJE = 0.86;
const HOLGURA = 24;
const BORDE = 16;
const ZONA_MINIMA = 48;
const ALFA_VUELO = 0.55;

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
      indice: i,
      fasePropia: azar() * Math.PI * 2,
      tam: 9 + azar() * 7 + desenfoque * 10,
      desenfoque,
      alfa: 0,
    };
  });
}

const seguir = (actual: number, objetivo: number, tasa: number, dt: number) =>
  actual + (objetivo - actual) * (1 - Math.exp(-dt * tasa));

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
    s.fase = fase;
    const deriva = Math.sin(e.tiempo * 0.25 + s.fasePropia);
    let tx = origen.x;
    let ty = origen.y;
    let alfaObjetivo = 0;
    let tasa = 0.9;

    if (fase === "vuelo") {
      const zona = zonas[s.indice % Math.max(1, zonas.length)];
      if (zona) {
        tx = zona[0] + (zona[1] - zona[0]) * s.carril + deriva * 14;
        tx = Math.min(zona[1], Math.max(zona[0], tx));
        const altura = (s.indice + 0.5) / 10;
        ty = e.alto * (0.12 + 0.76 * altura) + Math.cos(e.tiempo * 0.2 + s.fasePropia) * 20;
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

    s.x = seguir(s.x, tx, tasa, e.dt);
    s.y = seguir(s.y, ty, tasa, e.dt);

    // si en vuelo la semilla aún cruza la columna de texto, se mantiene oculta hasta salir de ella
    const detras = fase === "vuelo" && Math.abs(s.x - e.ancho / 2) < e.columna / 2 + HOLGURA;
    if (detras) alfaObjetivo = 0;
    s.alfa = detras ? 0 : seguir(s.alfa, alfaObjetivo, 1.5, e.dt);
  }
}

/** Semilla grande y desenfocada que cruza por delante cada ~8 s, solo con el hero a la vista. */
export function semillaCercana(
  tiempo: number,
  progreso: number,
): { activa: boolean; x: number; y: number } {
  const periodo = 8;
  const k = (tiempo % periodo) / periodo;
  const cruce = 0.6; // fracción del periodo que dura el cruce
  if (progreso >= 0.1 || k > cruce) return { activa: false, x: 0, y: 0 };
  const u = k / cruce;
  const ciclo = Math.floor(tiempo / periodo);
  return {
    activa: true,
    x: -0.1 + u * 1.2,
    y: 0.3 + 0.3 * Math.sin(ciclo * 1.7) + Math.sin(u * 6) * 0.04,
  };
}
