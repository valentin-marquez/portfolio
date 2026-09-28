// La atmósfera del prado: la estación y el tiempo del visitante lo visten. La primavera es el prado tal
// como lo dejan los parámetros; las otras estaciones cambian el pasto, la luz y la bruma, y encima el
// tiempo agrega nubes, lluvia, niebla o nieve. Los cambios entran de a poco: cuando llega el tiempo
// real, el prado se nubla o empieza a llover en unos segundos, no de golpe.
import { DESPEJADO, ESTACIONES, type Estacion, type Tiempo } from "@/clima/clima";
import type { Vec3 } from "./camara";
import type { Color, Parametros } from "./parametros";
import { suave } from "./viento";

export type Pesos = Record<Estacion, number>;

export interface Atmosfera {
  tiempo: Tiempo;
  /** cuánto de cada estación: suman 1 (en plena transición, dos a la vez) */
  estacion: Pesos;
}

/** Lo que el clima agrega al prado además de sus colores: lo que cae, lo que vuela y la escarcha. */
export interface Efectos {
  nubosidad: number;
  lluvia: number;
  nieve: number;
  /** 0..1 blanco en las puntas del pasto */
  escarcha: number;
  /** destello de un relámpago lejano, 0..1, en este instante */
  destello: number;
  /** cuántas mariposas, 0..1 del máximo */
  mariposas: number;
  /** cuántas hojas caen, 0..1 del máximo */
  hojas: number;
  /** motas de luz en el aire: cuántas (0..1) y de qué color */
  motas: number;
  colorMotas: Color;
}

const pesosDe = (e: Estacion): Pesos => ({
  primavera: e === "primavera" ? 1 : 0,
  verano: e === "verano" ? 1 : 0,
  otono: e === "otono" ? 1 : 0,
  invierno: e === "invierno" ? 1 : 0,
});

export function atmosferaDe(tiempo: Tiempo, estacion: Estacion): Atmosfera {
  return { tiempo: { ...tiempo }, estacion: pesosDe(estacion) };
}

// --- la transición, compartida por los dos prados y el sonido (función del reloj, sin estado que avanzar)

interface Transicion {
  desde: Atmosfera;
  hacia: Atmosfera;
  t0: number;
  duracion: number;
}

export const transicionCompartida: Transicion = {
  desde: atmosferaDe(DESPEJADO, "primavera"),
  hacia: atmosferaDe(DESPEJADO, "primavera"),
  t0: 0,
  duracion: 0,
};

const mezclar = (a: number, b: number, k: number) => a + (b - a) * k;

export function atmosferaEn(t: number, tr: Transicion = transicionCompartida): Atmosfera {
  const k = tr.duracion > 0 ? suave(0, 1, (t - tr.t0) / tr.duracion) : 1;
  const tiempo = { ...tr.hacia.tiempo };
  for (const clave of Object.keys(tiempo) as Array<keyof Tiempo>) {
    tiempo[clave] = mezclar(tr.desde.tiempo[clave], tr.hacia.tiempo[clave], k);
  }
  const estacion = { ...tr.hacia.estacion };
  for (const e of ESTACIONES) estacion[e] = mezclar(tr.desde.estacion[e], tr.hacia.estacion[e], k);
  return { tiempo, estacion };
}

/** El prado pasa a otra atmósfera desde donde esté ahora, en `duracion` segundos (0: de inmediato). */
export function fijarAtmosfera(
  hacia: Atmosfera,
  t: number,
  duracion = 6,
  tr: Transicion = transicionCompartida,
): void {
  tr.desde = atmosferaEn(t, tr);
  tr.hacia = hacia;
  tr.t0 = t;
  tr.duracion = duracion;
}

// --- cómo se ve cada estación (la primavera es la base: los parámetros tal cual)

interface Tono {
  tonoBase: Color;
  tonoCuerpo: Color;
  tonoPunta: Color;
  tonoTallo: Color;
  tonoSuelo: Color;
  colorSol: Color;
  ambiente: Color;
  translucidez: number;
  sol: Vec3;
  bruma: Color;
  densidad: number;
  arriba: Color;
  horizonte: Color;
}

const c = (r: number, g: number, b: number): Color => ({ r, g, b });

const TONOS: Record<Exclude<Estacion, "primavera">, Tono> = {
  // pasto más seco y dorado en las puntas, luz cálida que atraviesa más las hojas
  verano: {
    tonoBase: c(0.23, 0.27, 0.13),
    tonoCuerpo: c(0.5, 0.57, 0.31),
    tonoPunta: c(0.72, 0.7, 0.43),
    tonoTallo: c(0.49, 0.55, 0.33),
    tonoSuelo: c(0.6, 0.6, 0.41),
    colorSol: c(1, 0.92, 0.76),
    ambiente: c(0.53, 0.55, 0.45),
    translucidez: 0.4,
    sol: { x: 0.35, y: 0.3, z: -1 },
    bruma: c(0.95, 0.925, 0.85),
    densidad: 0.042,
    arriba: c(0.962, 0.952, 0.922),
    horizonte: c(0.975, 0.945, 0.875),
  },
  // ocre y oro, con el sol más bajo y anaranjado
  otono: {
    tonoBase: c(0.24, 0.23, 0.13),
    tonoCuerpo: c(0.52, 0.51, 0.31),
    tonoPunta: c(0.7, 0.6, 0.37),
    tonoTallo: c(0.49, 0.48, 0.31),
    tonoSuelo: c(0.59, 0.55, 0.39),
    colorSol: c(1, 0.86, 0.68),
    ambiente: c(0.52, 0.51, 0.43),
    translucidez: 0.42,
    sol: { x: 0.45, y: 0.16, z: -1 },
    bruma: c(0.945, 0.915, 0.85),
    densidad: 0.05,
    arriba: c(0.96, 0.952, 0.925),
    horizonte: c(0.972, 0.935, 0.87),
  },
  // verde grisáceo y apagado, luz pálida y fría, más bruma
  invierno: {
    tonoBase: c(0.19, 0.23, 0.17),
    tonoCuerpo: c(0.44, 0.52, 0.38),
    tonoPunta: c(0.61, 0.66, 0.53),
    tonoTallo: c(0.43, 0.48, 0.37),
    tonoSuelo: c(0.55, 0.57, 0.5),
    colorSol: c(0.97, 0.95, 0.9),
    ambiente: c(0.53, 0.56, 0.53),
    translucidez: 0.22,
    sol: { x: 0.3, y: 0.18, z: -1 },
    bruma: c(0.92, 0.93, 0.92),
    densidad: 0.062,
    arriba: c(0.952, 0.955, 0.95),
    horizonte: c(0.955, 0.955, 0.945),
  },
};

const GRIS_NUBE = c(0.915, 0.92, 0.91);
const GRIS_LLUVIA = c(0.86, 0.875, 0.87);
const BLANCO_NIEVE = c(0.93, 0.94, 0.95);
const ORO = c(1, 0.93, 0.72);
const ESCARCHA = c(0.92, 0.95, 1);

function mezclarColor(salida: Color, a: Color, b: Color, k: number) {
  salida.r = mezclar(a.r, b.r, k);
  salida.g = mezclar(a.g, b.g, k);
  salida.b = mezclar(a.b, b.b, k);
}

/** Promedio de un color entre la base (primavera) y las estaciones, según sus pesos. */
function ponderarColor(salida: Color, base: Color, pesos: Pesos, clave: keyof Tono) {
  let r = base.r * pesos.primavera;
  let g = base.g * pesos.primavera;
  let b = base.b * pesos.primavera;
  for (const e of ["verano", "otono", "invierno"] as const) {
    const v = TONOS[e][clave] as Color;
    r += v.r * pesos[e];
    g += v.g * pesos[e];
    b += v.b * pesos[e];
  }
  salida.r = r;
  salida.g = g;
  salida.b = b;
}

function ponderar(base: number, pesos: Pesos, clave: "translucidez" | "densidad"): number {
  let v = base * pesos.primavera;
  for (const e of ["verano", "otono", "invierno"] as const) v += TONOS[e][clave] * pesos[e];
  return v;
}

const escalar = (col: Color, k: number) => {
  col.r *= k;
  col.g *= k;
  col.b *= k;
};

/** Un relámpago lejano cada 9 a 20 s: dos pulsos rápidos, casi siempre fuera de la vista. */
export function destelloEn(t: number): number {
  const ciclo = Math.floor(t / 14);
  const azar = Math.sin(ciclo * 91.7 + 13.1) * 43758.5453;
  const inicio = (azar - Math.floor(azar)) * 9;
  const u = t - ciclo * 14 - inicio;
  if (u < 0 || u > 0.6) return 0;
  return Math.exp(-(((u - 0.05) / 0.04) ** 2)) + 0.6 * Math.exp(-(((u - 0.28) / 0.06) ** 2));
}

/**
 * Escribe en `salida` los parámetros del prado para esta atmósfera, partiendo de `base` (lo que
 * afina el panel de depuración). `salida` puede reutilizarse cuadro a cuadro: no se crea nada nuevo.
 */
export function aplicarAtmosfera(
  base: Parametros,
  a: Atmosfera,
  t: number,
  salida: Parametros,
): Efectos {
  const { tiempo: w, estacion: e } = a;
  const p = salida;
  const pb = base.pasto;
  // lo que no cambia con el clima se copia tal cual
  p.camara = base.camara;
  p.viento = base.viento;
  p.foco = base.foco;
  p.diente = base.diente;
  p.borde = base.borde;
  p.grano = base.grano;
  p.vista = base.vista;
  p.movimiento = base.movimiento;
  p.titulo = base.titulo;
  Object.assign(p.pasto, {
    alturaMin: pb.alturaMin,
    alturaMax: pb.alturaMax,
    ancho: pb.ancho,
    curva: pb.curva,
    torsion: pb.torsion,
    zCerca: pb.zCerca,
    zLejos: pb.zLejos,
  });

  // estación
  for (const clave of ["tonoBase", "tonoCuerpo", "tonoPunta", "tonoTallo", "tonoSuelo"] as const) {
    ponderarColor(p.pasto[clave], pb[clave], e, clave);
  }
  ponderarColor(p.luz.colorSol, base.luz.colorSol, e, "colorSol");
  ponderarColor(p.luz.ambiente, base.luz.ambiente, e, "ambiente");
  p.luz.translucidez = ponderar(base.luz.translucidez, e, "translucidez");
  const sol = p.luz.sol;
  sol.x = base.luz.sol.x * e.primavera;
  sol.y = base.luz.sol.y * e.primavera;
  sol.z = base.luz.sol.z * e.primavera;
  for (const est of ["verano", "otono", "invierno"] as const) {
    sol.x += TONOS[est].sol.x * e[est];
    sol.y += TONOS[est].sol.y * e[est];
    sol.z += TONOS[est].sol.z * e[est];
  }
  ponderarColor(p.bruma.color, base.bruma.color, e, "bruma");
  p.bruma.densidad = ponderar(base.bruma.densidad, e, "densidad");
  ponderarColor(p.cielo.arriba, base.cielo.arriba, e, "arriba");
  ponderarColor(p.cielo.horizonte, base.cielo.horizonte, e, "horizonte");

  // nubes: el sol se apaga y la luz se vuelve pareja; el cielo se agrisa
  const n = w.nubes;
  escalar(p.luz.colorSol, 1 - 0.62 * n);
  p.luz.ambiente.r += 0.1 * n;
  p.luz.ambiente.g += 0.1 * n;
  p.luz.ambiente.b += 0.11 * n;
  p.luz.translucidez *= 1 - 0.75 * n;
  mezclarColor(p.cielo.arriba, p.cielo.arriba, GRIS_NUBE, 0.55 * n);
  mezclarColor(p.cielo.horizonte, p.cielo.horizonte, GRIS_NUBE, 0.6 * n);
  mezclarColor(p.bruma.color, p.bruma.color, GRIS_NUBE, 0.45 * n);

  // lluvia: el pasto mojado se oscurece y el aire se llena de agua
  const ll = w.lluvia;
  for (const clave of ["tonoBase", "tonoCuerpo", "tonoPunta", "tonoTallo", "tonoSuelo"] as const) {
    escalar(p.pasto[clave], 1 - 0.16 * ll);
  }
  mezclarColor(p.bruma.color, p.bruma.color, GRIS_LLUVIA, 0.55 * ll);
  mezclarColor(p.cielo.horizonte, p.cielo.horizonte, GRIS_LLUVIA, 0.35 * ll);
  p.bruma.densidad += 0.03 * ll;

  // niebla: el fondo desaparece
  p.bruma.densidad += 0.1 * w.niebla;
  mezclarColor(p.bruma.color, p.bruma.color, c(0.935, 0.935, 0.92), 0.5 * w.niebla);

  // nieve: el suelo y las puntas se blanquean
  const nv = w.nieve;
  mezclarColor(p.pasto.tonoSuelo, p.pasto.tonoSuelo, BLANCO_NIEVE, 0.75 * nv);
  mezclarColor(p.pasto.tonoBase, p.pasto.tonoBase, BLANCO_NIEVE, 0.35 * nv);
  mezclarColor(p.bruma.color, p.bruma.color, BLANCO_NIEVE, 0.5 * nv);
  p.bruma.densidad += 0.03 * nv;

  const destello = w.tormenta > 0 ? destelloEn(t) * w.tormenta : 0;
  // con cualquier lluvia las mariposas se esconden y el polen no vuela
  const seco = Math.max(0, 1 - 4 * ll) * (1 - nv);
  const motasVerano = e.verano * seco;
  const motasInvierno = e.invierno * seco * 0.7;
  const colorMotas = c(0, 0, 0);
  mezclarColor(
    colorMotas,
    ORO,
    ESCARCHA,
    motasInvierno / Math.max(1e-4, motasVerano + motasInvierno),
  );
  return {
    nubosidad: n,
    lluvia: ll,
    nieve: nv,
    escarcha: Math.min(1, e.invierno * 0.35 + nv * 0.8),
    destello,
    mariposas: (e.primavera + e.verano) * seco * (1 - 0.7 * w.niebla),
    hojas: e.otono * (1 - nv) * (1 - 0.5 * ll),
    motas: Math.min(1, motasVerano + motasInvierno) * (1 - 0.8 * w.niebla),
    colorMotas,
  };
}

/** Una copia independiente de los parámetros, para usar como `salida` de aplicarAtmosfera. */
export function copiarParametros(p: Parametros): Parametros {
  return structuredClone(p);
}
