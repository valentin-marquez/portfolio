// Qué hace el botón de sonido. Se decide con el estado que había al tocarlo: el pointerdown de ese
// mismo toque ya puede haber arrancado el audio, y mirar el estado en el click lo silenciaría.
export type AccionSonido = "silenciar" | "activar" | "nada";

export function accionBotonSonido(sonabaAlTocar: boolean, silenciado: boolean): AccionSonido {
  if (sonabaAlTocar) return "silenciar";
  if (silenciado) return "activar";
  return "nada";
}
