// El contrato de cada capa de contenido: recibe el tiempo, la forma y la cámara, y aplica estilos.
import type { Camara } from "../camara";
import type { Forma } from "../forma";

export type Capa = (t: number, f: Forma, c: Camara) => void;
