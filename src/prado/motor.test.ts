import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { elegirCalidad } from "./calidad";
import { crearGlFalso, type GlFalso } from "./gl/gl-falso";
import { type EstadoPrado, montarPrado, pasoTiempo, visibleSegun } from "./motor";
import { crearParametros } from "./parametros";

describe("pasoTiempo", () => {
  it("el primer cuadro no avanza el tiempo", () => {
    expect(pasoTiempo(null, 1234)).toBe(0);
  });

  it("un cuadro normal avanza lo que dura", () => {
    expect(pasoTiempo(1000, 1016)).toBeCloseTo(0.016, 6);
  });

  it("al volver de una pestaña oculta (10 min) el paso queda acotado y nada salta", () => {
    expect(pasoTiempo(0, 600_000)).toBe(0.05);
  });

  it("si el reloj retrocede, el paso es cero", () => {
    expect(pasoTiempo(2000, 1000)).toBe(0);
  });
});

describe("visibleSegun", () => {
  it("con entradas acumuladas manda la más reciente, no la primera", () => {
    expect(visibleSegun([{ isIntersecting: false }, { isIntersecting: true }])).toBe(true);
    expect(visibleSegun([{ isIntersecting: true }, { isIntersecting: false }])).toBe(false);
  });
});

// --- montaje con un contexto falso: pérdida y recuperación del contexto ---

let alObservar: ((entradas: Array<{ isIntersecting: boolean }>) => void) | null = null;
let cuadros: Array<(t: number) => void> = [];

beforeEach(() => {
  alObservar = null;
  cuadros = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entradas: Array<{ isIntersecting: boolean }>) => void) {
        alObservar = cb;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
    cuadros.push(cb);
    return cuadros.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("window", { devicePixelRatio: 1 });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function montar(f: GlFalso, extra: Partial<Parameters<typeof montarPrado>[1]> = {}) {
  const lienzo = Object.assign(new EventTarget(), {
    width: 0,
    height: 0,
    clientWidth: 1000,
    clientHeight: 560,
    getContext: () => f.gl,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 560 }),
  }) as unknown as HTMLCanvasElement;
  const estados: EstadoPrado[] = [];
  const prado = montarPrado(lienzo, {
    semilla: 1,
    dientes: 3,
    parametros: crearParametros(),
    calidad: elegirCalidad({ anchoCss: 1440, dpr: 1, nucleos: 8 }),
    reducirMovimiento: false,
    alCambiarEstado: (e) => estados.push(e),
    ...extra,
  });
  return { lienzo, prado, estados };
}

const perder = (lienzo: HTMLCanvasElement) =>
  lienzo.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
const recuperar = (lienzo: HTMLCanvasElement) =>
  lienzo.dispatchEvent(new Event("webglcontextrestored"));

describe("montarPrado ante la pérdida del contexto", () => {
  it("al recuperar el contexto vuelve a pedir la extensión de color flotante", () => {
    const f = crearGlFalso();
    const { lienzo } = montar(f);
    perder(lienzo);
    f.olvidarExtensiones();
    recuperar(lienzo);
    expect(f.estado.pedidas.has("EXT_color_buffer_float")).toBe(true);
  });

  it("avisa 'perdido' al perderlo y 'activo' al recuperarlo", () => {
    const f = crearGlFalso();
    const { lienzo, estados } = montar(f);
    perder(lienzo);
    f.olvidarExtensiones();
    recuperar(lienzo);
    expect(estados).toEqual(["perdido", "activo"]);
  });

  it("si tras recuperarlo ya no hay color flotante, avisa 'fallido' (la ventana muestra el respaldo)", () => {
    const f = crearGlFalso();
    const { lienzo, estados } = montar(f);
    perder(lienzo);
    f.olvidarExtensiones();
    f.estado.extensionFlotante = false;
    recuperar(lienzo);
    expect(estados.at(-1)).toBe("fallido");
  });

  it("un error dentro de un cuadro no escapa: detiene el ciclo y avisa 'fallido'", () => {
    const f = crearGlFalso();
    const { estados } = montar(f);
    f.estado.completo = false;
    alObservar?.([{ isIntersecting: true }]);
    const cuadro = cuadros.at(-1);
    expect(cuadro).toBeDefined();
    expect(() => cuadro?.(16)).not.toThrow();
    expect(estados.at(-1)).toBe("fallido");
  });
});

describe("montarPrado controlado desde afuera", () => {
  it("en pausa no pide más cuadros, y al salir de la pausa vuelve a dibujar", () => {
    const f = crearGlFalso();
    const { prado } = montar(f);
    alObservar?.([{ isIntersecting: true }]);
    prado?.fijarEnPausa(true);
    const pendientes = cuadros.length;
    cuadros.at(-1)?.(16);
    expect(cuadros.length).toBe(pendientes);
    prado?.fijarEnPausa(false);
    expect(cuadros.length).toBe(pendientes + 1);
  });

  it("cada cuadro deja que la página ajuste la cámara (por ejemplo, según el scroll)", () => {
    const f = crearGlFalso();
    const vistas: number[] = [];
    montar(f, {
      ajustarCamara: (base) => {
        vistas.push(base.altura);
        return { ...base, altura: base.altura + 1 };
      },
    });
    alObservar?.([{ isIntersecting: true }]);
    cuadros.at(-1)?.(16);
    expect(vistas).toEqual([1.6]);
  });
});
