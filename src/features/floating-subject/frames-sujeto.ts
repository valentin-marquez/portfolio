/**
 * Qué frames tiene el bucle idle de cada ancla, en orden.
 *
 * El frame 0 es la pose asentada: el reloj propio del sujeto la retiene varios
 * segundos y los demás pasan en un parpadeo, así que quien dibuje el bucle debe
 * poner en el 0 la pose que quiere ver casi todo el tiempo, y en los siguientes
 * el gesto (bajar la vista al brote, ladear la cabeza). Se cortan, no se
 * funden: cuanto más se parezcan al 0, mejor lee el corte.
 *
 * La posición de la cabeza importa: las anclas 'hombro' y 'cara' encuadran
 * cerca de la cabeza (ver mirarA en encuadres.ts), así que el bucle debe
 * mantenerla en la misma zona del encuadre en todos sus frames. Conviene
 * además que los frames de un ancla estén alineados entre sí por los pies:
 * lo que se mueva de más, la transición lo enseña como deriva.
 *
 * Los de 'cuerpo', 'hombro' y 'cara' siguen siendo de relleno mientras no
 * exista el arte final (ver diseño del 14-09, §1): sustituir los PNG en
 * public/sujeto/ no requiere tocar este fichero salvo que cambie el número
 * de frames por ancla.
 */
export const framesPorAncla: Record<string, readonly string[]> = {
  lejos: ["/sujeto/lejos-0.png", "/sujeto/lejos-1.png", "/sujeto/lejos-2.png"],
  cuerpo: ["/sujeto/cuerpo-0.png", "/sujeto/cuerpo-1.png", "/sujeto/cuerpo-2.png"],
  hombro: ["/sujeto/hombro-0.png", "/sujeto/hombro-1.png", "/sujeto/hombro-2.png"],
  cara: ["/sujeto/cara-0.png", "/sujeto/cara-1.png", "/sujeto/cara-2.png"],
};
