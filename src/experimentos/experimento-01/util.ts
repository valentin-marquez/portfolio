// Utilidades numéricas compartidas.
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const mezclar = (a: number, b: number, k: number) => a + (b - a) * k;

/** lee un arreglo por índice y falla fuerte si no existe (el tsconfig usa noUncheckedIndexedAccess) */
export function en<T>(lista: readonly T[], i: number): T {
  const v = lista[i];
  if (v === undefined) throw new Error(`índice ${i} fuera de rango (largo ${lista.length})`);
  return v;
}
