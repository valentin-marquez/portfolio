// Ruido rosa con el filtro "económico" de Paul Kellet: más grave que el blanco, suena a viento.
export function generarRuidoRosa(n: number, azar: () => number): Float32Array<ArrayBuffer> {
  const salida = new Float32Array(n);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let pico = 1e-9;
  for (let i = 0; i < n; i++) {
    const blanco = azar() * 2 - 1;
    b0 = 0.99765 * b0 + blanco * 0.099046;
    b1 = 0.963 * b1 + blanco * 0.2965164;
    b2 = 0.57 * b2 + blanco * 1.0526913;
    const v = b0 + b1 + b2 + blanco * 0.1848;
    salida[i] = v;
    pico = Math.max(pico, Math.abs(v));
  }
  let media = 0;
  for (let i = 0; i < n; i++) media += salida[i] as number;
  media /= n;
  const escala = 1 / (pico + Math.abs(media));
  for (let i = 0; i < n; i++) salida[i] = ((salida[i] as number) - media) * escala;
  return salida;
}
