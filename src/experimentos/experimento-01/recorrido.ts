// Trazos a mano para el cursor y la curva del gráfico: pasa por puntos (t, x) con tangentes de
// Catmull-Rom y parte y termina quieto, como una mano que agarra y suelta.
import { en } from "./util";

export type Punto = readonly [t: number, x: number];

export function recorrido(puntos: readonly Punto[]): (t: number) => number {
  if (puntos.length < 2) throw new Error("un recorrido necesita al menos dos puntos");
  const n = puntos.length;
  const ts = puntos.map((p) => p[0]);
  const xs = puntos.map((p) => p[1]);
  for (let i = 1; i < n; i++) {
    if (en(ts, i) <= en(ts, i - 1)) throw new Error("los tiempos de un recorrido deben crecer");
  }
  const m = xs.map((_, i) =>
    i === 0 || i === n - 1 ? 0 : (en(xs, i + 1) - en(xs, i - 1)) / (en(ts, i + 1) - en(ts, i - 1)),
  );
  return (t) => {
    if (t <= en(ts, 0)) return en(xs, 0);
    if (t >= en(ts, n - 1)) return en(xs, n - 1);
    let i = 0;
    while (t > en(ts, i + 1)) i++;
    const h = en(ts, i + 1) - en(ts, i);
    const s = (t - en(ts, i)) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * en(xs, i) +
      (s3 - 2 * s2 + s) * h * en(m, i) +
      (-2 * s3 + 3 * s2) * en(xs, i + 1) +
      (s3 - s2) * h * en(m, i + 1)
    );
  };
}
