// El tiempo del experimento: todo es función pura de t (segundos desde el clic en Register).
// Tres pausas de impacto congelan la pose un instante mientras la cámara sigue temblando.
// Valores medidos del «trans<form>er» de jhey cuadro a cuadro y afinados en el prototipo.

export const paso = (a: number, b: number, x: number) =>
  Math.min(1, Math.max(0, (x - a) / (b - a)));
export const suave = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
/** arranque seco y freno largo */
export const sale = (k: number) => 1 - (1 - k) ** 4;
/** acelera hasta el golpe */
export const entra = (k: number) => k * k * k;
/** se pasa un poco y vuelve */
export const pasa = (k: number) => {
  const c = 2.2;
  return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
};
export const tramo = (a: number, b: number, t: number, f: (k: number) => number = suave) =>
  f(paso(a, b, t));
/** Mth.triangleWave de Minecraft: la onda de las piernas y los brazos al caminar */
export const triangulo = (x: number, periodo: number) =>
  (Math.abs((((x % periodo) + periodo) % periodo) - periodo * 0.5) - periodo * 0.25) /
  (periodo * 0.25);
export const azar = (semilla: number) => {
  let s = semilla | 0;
  return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) | 0) >>> 0) / 4294967296;
};
/** ruido suave y determinista: suma de senos de frecuencias que no se repiten entre sí (6 a 14 Hz) */
export const ruido = (t: number, s: number) =>
  0.5 * Math.sin(t * 37.1 + s) +
  0.3 * Math.sin(t * 61.7 + s * 2.3) +
  0.2 * Math.sin(t * 89.3 + s * 4.1);

/** [tiempo de pose, duración]: las piernas contra el piso, la cabeza y el flechazo */
export const PAUSAS: readonly [number, number][] = [
  [2.1, 0.07],
  [3.86, 0.07],
  [11.86, 0.09],
];
export const tiempoPose = (t: number) => {
  let p = t;
  for (const [a, h] of PAUSAS) if (p > a) p = Math.max(a, p - h);
  return p;
};
export const tiempoReal = (p: number) =>
  p + PAUSAS.filter(([a]) => a < p).reduce((s, [, h]) => s + h, 0);
export const FIN = tiempoReal(15.0);

// momentos clave (tiempo de pose)
/** el DOM termina de reaccionar y entra el canvas */
export const SWAP = 0.5;
export const DISPARO = 11.62;
export const IMPACTO = 11.86;
export const MUERE = 11.95;
export const POOF = 12.95;
export const ENCAJA = 14.25;
/** vuelve el DOM de gracias */
export const VUELVE_DOM = 14.7;

/** muerte de Minecraft (LivingEntityRenderer): f = √((deathTime − 1) / 20 · 1,6), cae de costado 90° */
export const caeMuerto = (p: number) =>
  Math.min(1, Math.sqrt(Math.max(0, (((p - MUERE) * 20 - 1) / 20) * 1.6)));
/** cuando la caída llega a 90° */
export const TOCA_PISO = MUERE + (20 / 1.6 + 1) / 20;
/** cuánto avanza hacia la cámara al caminar */
export const caminata = (p: number) => 10 * tramo(7.9, 10.2, p, (k) => k * k * (3 - 2 * k));
/** cada paso de la caminata */
export const PISA: readonly number[] = [8.45, 9.1, 9.75];

export type Fuente = {
  tipo: "polvo" | "hierro" | "humo";
  x: number;
  y: number;
  z: number;
  cuantas: number;
  fuerza: number;
};
export type Golpe = { p: number; trauma: number; fuentes: Fuente[] };
const f = (
  tipo: Fuente["tipo"],
  x: number,
  y: number,
  z: number,
  cuantas: number,
  fuerza: number,
): Fuente => ({
  tipo,
  x,
  y,
  z,
  cuantas,
  fuerza,
});
/** donde queda la nube cuando el gólem desaparece */
export const HUMO = { x: -20, y: 5, z: 10 };
/** los golpes: sacuden la cámara (trauma) y sueltan partículas */
export const GOLPES: Golpe[] = [
  { p: 1.15, trauma: 0.55, fuentes: [] },
  { p: 1.5, trauma: 0.22, fuentes: [] },
  {
    p: 2.1,
    trauma: 0.9,
    fuentes: [f("polvo", -4.5, 0, 0, 22, 1.4), f("polvo", 4.5, 0, 0, 22, 1.4)],
  },
  { p: 2.45, trauma: 0.6, fuentes: [f("polvo", 0, 0, 0, 30, 1.8)] },
  { p: 2.4, trauma: 0.25, fuentes: [] },
  { p: 2.8, trauma: 0.3, fuentes: [] },
  { p: 3.15, trauma: 0.35, fuentes: [] },
  { p: 3.3, trauma: 0.4, fuentes: [] },
  { p: 3.86, trauma: 1.0, fuentes: [f("hierro", 0, 36, 2, 40, 2.2), f("polvo", 0, 0, 0, 24, 1.2)] },
  { p: 4.1, trauma: 0.3, fuentes: [] },
  { p: 4.55, trauma: 0.35, fuentes: [] },
  ...PISA.map((p, k) => ({
    p,
    trauma: 0.35,
    fuentes: [f("polvo", k % 2 ? 4.5 : -4.5, 0, (10 * (k + 1)) / 4, 12, 0.8)],
  })),
  { p: IMPACTO, trauma: 0.8, fuentes: [f("hierro", 4, 27, 16, 14, 0.9)] },
  { p: TOCA_PISO, trauma: 0.75, fuentes: [f("polvo", -22, 0, 7.5, 34, 1.9)] },
  { p: POOF, trauma: 0.2, fuentes: [f("humo", HUMO.x, 2, HUMO.z, 52, 1)] },
  { p: ENCAJA, trauma: 0.3, fuentes: [] },
];
/** trauma de cámara (Eiserloh): cada golpe suma y decae exponencialmente; t es tiempo real */
export function trauma(t: number) {
  let s = 0;
  for (const g of GOLPES) {
    const e = t - tiempoReal(g.p);
    if (e >= 0) s += g.trauma * Math.exp(-e * 5.5);
  }
  return Math.min(1, s);
}
