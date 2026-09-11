/**
 * Formas recortadas: el vocabulario de interfaz de la pieza.
 *
 * Leído del código de persona-im (§2.0 del diseño). Dos técnicas, y las dos
 * importan más de lo que parecen:
 *
 * 1. La caja NUNCA es una caja. Sus cuatro esquinas están desplazadas cantidades
 *    distintas, así que no hay un solo ángulo recto.
 * 2. El contorno son DOS formas, no un borde: una exterior y otra interior
 *    recortada cantidades DESIGUALES en cada lado. Un borde uniforme —que es lo
 *    único que sabe hacer CSS— delata al instante que no está recortado a mano.
 */

export type Punto = readonly [number, number];

/**
 * Ruido determinista. Interesa que la irregularidad sea fija y reproducible: si
 * cambiara por fotograma, la forma temblaría en vez de estar recortada.
 */
function azar(semilla: number, indice: number): number {
  const x = Math.sin(semilla * 127.1 + indice * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Rectángulo al que se le tuercen las cuatro esquinas, cada una a su manera. */
export function rectanguloIrregular(
  ancho: number,
  alto: number,
  irregularidad: number,
  semilla: number,
): Punto[] {
  const x = ancho / 2;
  const y = alto / 2;
  const base: Punto[] = [
    [-x, y],
    [x, y],
    [x, -y],
    [-x, -y],
  ];

  if (irregularidad === 0) return base;

  // Cada eje se desvía con SU propia dimensión, no con la menor de las dos: en
  // persona-im las esquinas se mueven decenas de píxeles a lo ancho y solo unos
  // pocos a lo alto. Escalarlo todo por la dimensión menor deja una barra plana
  // prácticamente recta, que es justo lo que hay que evitar.
  const amplitudX = ancho * 0.055 * irregularidad;
  const amplitudY = alto * 0.16 * irregularidad;

  return base.map(([px, py], i) => [
    px + azar(semilla, i * 2) * amplitudX,
    py + azar(semilla, i * 2 + 1) * amplitudY,
  ]);
}

/**
 * Forma interior, recortada hacia dentro cantidades distintas en cada esquina.
 *
 * Dibujando la exterior en crema y ésta en tinta encima queda el contorno grueso
 * y desigual del lenguaje.
 */
export function interiorDesigual(
  exterior: readonly Punto[],
  grosor: number,
  semilla: number,
): Punto[] {
  if (grosor === 0) return [...exterior];

  const centro = exterior.reduce(
    (acumulado, [px, py]) =>
      [acumulado[0] + px / exterior.length, acumulado[1] + py / exterior.length] as [
        number,
        number,
      ],
    [0, 0] as [number, number],
  );

  return exterior.map(([px, py], i) => {
    // Se mete en X y en Y por separado, no a lo largo de la línea al centro.
    // Empujar hacia el centro da un contorno fino arriba y abajo en las cajas
    // anchas; en persona-im cada esquina se recorta cantidades independientes por
    // eje, y ahí está el aspecto de recortado a tijera.
    const metido = (v: number, c: number, indice: number) => {
      const factor = 1 + azar(semilla + 41, indice) * 0.5;
      const paso = Math.min(grosor * factor, Math.abs(c - v) * 0.4);
      return v + Math.sign(c - v) * paso;
    };

    return [metido(px, centro[0], i * 2), metido(py, centro[1], i * 2 + 1)] as Punto;
  });
}
