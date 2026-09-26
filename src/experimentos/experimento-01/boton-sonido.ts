// Qué hace el botón de sonido. Se decide con el estado que había al tocarlo: el pointerdown de ese
// mismo toque ya puede haber arrancado el audio, y mirar el estado en el click lo silenciaría.
export type AccionSonido = "silenciar" | "activar" | "nada";

export function accionBotonSonido(sonabaAlTocar: boolean, silenciado: boolean): AccionSonido {
  if (sonabaAlTocar) return "silenciar";
  if (silenciado) return "activar";
  return "nada";
}

/** volumen de la cumbia al llegar por primera vez */
export const VOLUMEN_INICIAL = 0.2;

/** el volumen guardado (texto de localStorage), acotado a [0, 1] */
export function volumenGuardado(texto: string | null): number {
  const v = Number.parseFloat(texto ?? "");
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : VOLUMEN_INICIAL;
}
