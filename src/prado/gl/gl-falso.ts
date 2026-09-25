// Contexto WebGL2 falso, solo para tests: registra las llamadas y permite simular un framebuffer
// incompleto, un contexto perdido o que falte la extensión de color flotante. La app no lo importa.

export interface EstadoGlFalso {
  completo: boolean;
  perdido: boolean;
  extensionFlotante: boolean;
  /** extensiones pedidas desde la última llamada a olvidarExtensiones() */
  pedidas: Set<string>;
}

export interface GlFalso {
  gl: WebGL2RenderingContext;
  llamadas: Map<string, number>;
  estado: EstadoGlFalso;
  /** lo que hace el navegador al perder el contexto: las extensiones habilitadas se pierden */
  olvidarExtensiones(): void;
}

export function crearGlFalso(): GlFalso {
  const llamadas = new Map<string, number>();
  const estado: EstadoGlFalso = {
    completo: true,
    perdido: false,
    extensionFlotante: true,
    pedidas: new Set(),
  };
  const constantes = new Map<string, number>();
  const constante = (nombre: string): number => {
    const existente = constantes.get(nombre);
    if (existente !== undefined) return existente;
    const nueva = 0x1000 + constantes.size;
    constantes.set(nombre, nueva);
    return nueva;
  };

  const especiales: Record<string, (...args: unknown[]) => unknown> = {
    getExtension: (nombre) => {
      estado.pedidas.add(String(nombre));
      if (nombre === "EXT_color_buffer_float" && !estado.extensionFlotante) return null;
      return {};
    },
    checkFramebufferStatus: () =>
      estado.completo && estado.pedidas.has("EXT_color_buffer_float")
        ? constante("FRAMEBUFFER_COMPLETE")
        : constante("FRAMEBUFFER_INCOMPLETE_ATTACHMENT"),
    isContextLost: () => estado.perdido,
    getParameter: () => 4,
    getShaderParameter: () => true,
    getProgramParameter: () => true,
    getShaderInfoLog: () => "",
    getProgramInfoLog: () => "",
  };

  const gl = new Proxy(
    {},
    {
      get(_, propiedad) {
        if (typeof propiedad !== "string") return undefined;
        if (/^[A-Z0-9_]+$/.test(propiedad)) return constante(propiedad);
        return (...args: unknown[]) => {
          llamadas.set(propiedad, (llamadas.get(propiedad) ?? 0) + 1);
          const especial = especiales[propiedad];
          return especial ? especial(...args) : {};
        };
      },
    },
  ) as unknown as WebGL2RenderingContext;

  return {
    gl,
    llamadas,
    estado,
    olvidarExtensiones() {
      estado.pedidas.clear();
    },
  };
}
