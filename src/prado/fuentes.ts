// Arma la fuente completa de cada programa: cabecera + bibliotecas compartidas + etapa.
import { CABECERA } from "./gl/programa";
import cieloFrag from "./shaders/cielo.frag?raw";
import composicionFrag from "./shaders/composicion.frag?raw";
import comun from "./shaders/comun.glsl?raw";
import dienteFrag from "./shaders/diente.frag?raw";
import dienteVert from "./shaders/diente.vert?raw";
import dofFrag from "./shaders/dof.frag?raw";
import hoja from "./shaders/hoja.glsl?raw";
import pantallaVert from "./shaders/pantalla.vert?raw";
import pastoFrag from "./shaders/pasto.frag?raw";
import pastoVert from "./shaders/pasto.vert?raw";
import semillaFrag from "./shaders/semilla.frag?raw";
import semillaVert from "./shaders/semilla.vert?raw";

const conHoja = CABECERA + comun + hoja;

export const FUENTES = {
  cielo: { vert: CABECERA + pantallaVert, frag: CABECERA + comun + cieloFrag },
  pasto: { vert: conHoja + pastoVert, frag: CABECERA + comun + pastoFrag },
  diente: { vert: conHoja + dienteVert, frag: CABECERA + comun + dienteFrag },
  dof: { vert: CABECERA + pantallaVert, frag: CABECERA + dofFrag },
  composicion: { vert: CABECERA + pantallaVert, frag: CABECERA + comun + composicionFrag },
  semilla: { vert: CABECERA + semillaVert, frag: CABECERA + semillaFrag },
} satisfies Record<string, { vert: string; frag: string }>;
