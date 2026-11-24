// Términos que se explican con una tarjeta al pasar por encima. Lo general vive aquí, para que sirva en
// todas las notas; lo que el término hace en cada nota va en su HTML, en data-uso.
export const GLOSARIO = {
  herramienta: {
    nombre: "Herramienta",
    que: "Una función que el modelo puede pedir que se ejecute, con sus argumentos. El modelo no sabe el dato: sabe a quién preguntárselo.",
  },
  toks: {
    nombre: "tok/s",
    que: "Tokens por segundo: cuántos trozos de texto genera el modelo en un segundo. Es la velocidad que se siente al usarlo.",
  },
  qlora: {
    nombre: "QLoRA",
    que: "Forma barata de ajustar un modelo: se congela el original, comprimido a 4 bits, y solo se entrenan unas matrices pequeñas que se suman a sus capas.",
  },
  gguf: {
    nombre: "GGUF",
    que: "El formato de archivo de llama.cpp: un solo archivo con los pesos, el vocabulario y la plantilla de conversación.",
  },
  cuant: {
    nombre: "Q4_K_M",
    que: "Un nivel de cuantización de llama.cpp: cada peso pasa de 16 bits a unos 4 y medio. El archivo baja a menos de un tercio y corre en CPU, a cambio de una pérdida chica de precisión.",
  },
  adamw: {
    nombre: "adamw()",
    que: "El optimizador: decide cuánto mover cada peso en cada paso. Lleva un promedio del gradiente por peso y les resta un poco a todos para que no crezcan sin control.",
  },
  coseno: {
    nombre: "Tasa con coseno",
    que: "La tasa de aprendizaje parte alta y baja siguiendo media onda de coseno: pasos grandes al comienzo, cada vez más finos hacia el final.",
  },
  ciego: {
    nombre: "Conjunto ciego",
    que: "Preguntas de evaluación escritas por alguien que no vio el código ni los datos de entrenamiento. Miden si el modelo aprendió la tarea o memorizó ejemplos.",
  },
} satisfies Record<string, { nombre: string; que: string }>;

export type Termino = keyof typeof GLOSARIO;

export function esTermino(clave: string | undefined): clave is Termino {
  return clave !== undefined && Object.hasOwn(GLOSARIO, clave);
}
