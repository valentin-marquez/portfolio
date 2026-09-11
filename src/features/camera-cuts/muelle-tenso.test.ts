import { describe, expect, test } from "vitest";
import { type AjusteMuelle, type EstadoMuelle, pasoMuelle } from "./muelle-tenso";

const PASO = 1 / 60;

/**
 * El factor de amortiguamiento es ζ = c / (2·√k). Con ζ = 1 el muelle llega al
 * objetivo sin pasarse nunca, así que para tener sobrepaso hace falta ζ < 1.
 * Aquí ζ ≈ 0,61, que da alrededor de un 9% de sobrepaso: se pasa y vuelve una
 * sola vez.
 */
const TENSO: AjusteMuelle = { rigidez: 170, amortiguacion: 16 };

const quieto: EstadoMuelle = { valor: 0, velocidad: 0 };

function trayectoria(objetivo: number, pasos: number, ajuste = TENSO, paso = PASO) {
  const camino: EstadoMuelle[] = [];
  let estado = quieto;
  for (let i = 0; i < pasos; i++) {
    estado = pasoMuelle(estado, objetivo, ajuste, paso);
    camino.push(estado);
  }
  return camino;
}

describe("pasoMuelle", () => {
  test("converge al objetivo y se queda parado", () => {
    const camino = trayectoria(1, 120);
    const final = camino[camino.length - 1];

    expect(final?.valor).toBeCloseTo(1, 3);
    expect(Math.abs(final?.velocidad ?? 1)).toBeLessThan(0.01);
  });

  test("un muelle tenso sobrepasa, pero poco", () => {
    const maximo = Math.max(...trayectoria(1, 120).map((e) => e.valor));

    // sobrepasa: sin sobrepaso no es el lenguaje que buscamos
    expect(maximo).toBeGreaterThan(1);
    // pero es tenso: nada de rebotes de dibujo animado
    expect(maximo).toBeLessThan(1.12);
  });

  test("el rebote no se ve: el segundo sobrepaso es residuo del primero", () => {
    // Un muelle con ζ < 1 oscila y cruza el objetivo muchas veces; lo que decide
    // si se percibe como "un golpe" o como "un muelle de dibujos" es cuánto queda
    // del rebote en la segunda pasada.
    const valores = trayectoria(1, 300).map((e) => e.valor);
    const picos: number[] = [];
    for (let i = 1; i < valores.length - 1; i++) {
      const v = valores[i] ?? 0;
      if (v > 1 && v >= (valores[i - 1] ?? 0) && v > (valores[i + 1] ?? 0)) picos.push(v - 1);
    }

    expect(picos.length).toBeGreaterThanOrEqual(2);
    expect(picos[1] ?? 1).toBeLessThan((picos[0] ?? 0) * 0.2);
  });

  test("una amortiguación alta llega sin sobrepasar", () => {
    const maximo = Math.max(
      ...trayectoria(1, 200, { rigidez: 170, amortiguacion: 60 }).map((e) => e.valor),
    );
    expect(maximo).toBeLessThanOrEqual(1.0001);
  });

  test("no diverge con un paso de tiempo enorme", () => {
    // una pestaña en segundo plano devuelve saltos de medio segundo o más;
    // un integrador de Euler sin trocear explota justo aquí
    const estado = pasoMuelle(quieto, 1, TENSO, 0.5);

    expect(Number.isFinite(estado.valor)).toBe(true);
    expect(estado.valor).toBeGreaterThanOrEqual(0);
    expect(estado.valor).toBeLessThanOrEqual(1.2);
  });

  test("un paso de tiempo cero no mueve nada", () => {
    const estado = pasoMuelle({ valor: 0.4, velocidad: 2 }, 1, TENSO, 0);

    expect(estado.valor).toBe(0.4);
    expect(estado.velocidad).toBe(2);
  });

  test("no muta el estado que recibe", () => {
    const inicial: EstadoMuelle = { valor: 0, velocidad: 0 };
    pasoMuelle(inicial, 1, TENSO, PASO);

    expect(inicial).toEqual({ valor: 0, velocidad: 0 });
  });
});
