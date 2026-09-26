import { describe, expect, it } from "vitest";
import { type Almacen, crearControlAudio, type MotorSonido } from "./control";

function motorFalso(sonandoAlArrancar = true) {
  const llamadas: string[] = [];
  let sonando = false;
  const motor: MotorSonido = {
    arrancar: (s) => {
      llamadas.push(`arrancar:${s}`);
      sonando = sonandoAlArrancar;
    },
    fijarViento: (i, frente) => llamadas.push(`viento:${i.toFixed(2)}@${frente.toFixed(2)}`),
    fijarSilencio: (s) => llamadas.push(`silencio:${s}`),
    suspender: () => llamadas.push("suspender"),
    reanudar: () => {
      llamadas.push("reanudar");
      sonando = true;
    },
    soplo: (paneo) => llamadas.push(`soplo:${paneo.toFixed(1)}`),
    sonando: () => sonando,
    destruir: () => llamadas.push("destruir"),
  };
  return { motor, llamadas };
}

function almacenEnMemoria(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return { datos, getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => void datos.set(k, v) };
}

const almacenQueLanza: Almacen = {
  getItem: () => {
    throw new Error("bloqueado");
  },
  setItem: () => {
    throw new Error("bloqueado");
  },
};

function tecla(key: string) {
  return Object.assign(new Event("keydown"), { key });
}

function montar(almacen: Almacen | null = almacenEnMemoria(), sonandoAlArrancar = true) {
  const { motor, llamadas } = motorFalso(sonandoAlArrancar);
  let creados = 0;
  const ventana = new EventTarget();
  const documento = Object.assign(new EventTarget(), { hidden: false });
  const control = crearControlAudio({
    crearMotor: () => {
      creados++;
      return motor;
    },
    almacen,
    ventana,
    documento,
  });
  return { control, llamadas, ventana, documento, creados: () => creados };
}

describe("crearControlAudio", () => {
  it("no crea el audio antes del primer gesto (política de autoplay)", () => {
    const m = montar();
    m.control.fijarViento(0.5);
    expect(m.creados()).toBe(0);
  });

  it("arranca con el primer gesto y aplica el viento que ya se había pedido", () => {
    const m = montar();
    m.control.fijarViento(0.5);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    expect(m.llamadas).toEqual(["arrancar:false", "viento:0.50@0.50"]);
  });

  it("un segundo gesto no crea otro motor", () => {
    const m = montar();
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.ventana.dispatchEvent(new Event("pointerdown"));
    expect(m.creados()).toBe(1);
  });

  it("la tecla M silencia, lo recuerda y la segunda M lo reactiva", () => {
    const almacen = almacenEnMemoria();
    const m = montar(almacen);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.ventana.dispatchEvent(tecla("m"));
    expect(m.control.silenciado).toBe(true);
    expect(almacen.datos.get("prado:silencio")).toBe("1");
    m.ventana.dispatchEvent(tecla("M"));
    expect(m.control.silenciado).toBe(false);
    expect(m.llamadas).toContain("silencio:true");
    expect(m.llamadas).toContain("silencio:false");
  });

  it("si la primera interacción es M, arranca ya silenciado", () => {
    const m = montar();
    m.ventana.dispatchEvent(tecla("m"));
    expect(m.llamadas[0]).toBe("arrancar:true");
  });

  it("respeta la preferencia guardada de una visita anterior", () => {
    const almacen = almacenEnMemoria();
    almacen.datos.set("prado:silencio", "1");
    const m = montar(almacen);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    expect(m.llamadas[0]).toBe("arrancar:true");
  });

  it("con la pestaña oculta se suspende y al volver se reanuda", () => {
    const m = montar();
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.documento.hidden = true;
    m.documento.dispatchEvent(new Event("visibilitychange"));
    m.documento.hidden = false;
    m.documento.dispatchEvent(new Event("visibilitychange"));
    expect(m.llamadas.slice(-2)).toEqual(["suspender", "reanudar"]);
  });

  it("si el almacenamiento lanza (modo privado), el audio y la M siguen funcionando", () => {
    const m = montar(almacenQueLanza);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    expect(() => m.ventana.dispatchEvent(tecla("m"))).not.toThrow();
    expect(m.control.silenciado).toBe(true);
  });

  it("no reenvía cambios de viento imperceptibles", () => {
    const m = montar();
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.control.fijarViento(0.3);
    m.control.fijarViento(0.305);
    expect(m.llamadas.filter((l) => l.startsWith("viento")).length).toBe(2);
  });

  it("en pantallas táctiles, si el primer toque no activó el audio, el siguiente gesto lo reanuda", () => {
    const m = montar(almacenEnMemoria(), false);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.ventana.dispatchEvent(new Event("pointerup"));
    expect(m.llamadas).toContain("reanudar");
  });

  it("si el audio ya suena, los gestos siguientes no lo tocan", () => {
    const m = montar();
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.ventana.dispatchEvent(new Event("pointerup"));
    m.ventana.dispatchEvent(new Event("click"));
    expect(m.llamadas).not.toContain("reanudar");
  });

  it("reenvía el frente de la ola para que el sonido cruce con ella", () => {
    const m = montar();
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.control.fijarViento(0.5, 0.2);
    m.control.fijarViento(0.5, 0.8);
    expect(m.llamadas).toContain("viento:0.50@0.20");
    expect(m.llamadas).toContain("viento:0.50@0.80");
  });

  it("el soplo de una flor suena solo si el ambiente ya arrancó", () => {
    const m = montar();
    m.control.soplo(0.5);
    expect(m.llamadas.some((l) => l.startsWith("soplo"))).toBe(false);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.control.soplo(-0.5);
    expect(m.llamadas).toContain("soplo:-0.5");
  });
});

describe("alternarSilencio", () => {
  const crear = (almacen: Almacen & { datos: Map<string, string> }) => {
    const { motor, llamadas } = motorFalso();
    const avisos: boolean[] = [];
    const ventana = new EventTarget();
    const control = crearControlAudio({
      crearMotor: () => motor,
      almacen,
      ventana,
      documento: Object.assign(new EventTarget(), { hidden: false }),
      alCambiar: (s) => avisos.push(s),
    });
    return { control, llamadas, avisos, ventana };
  };

  it("silencia, lo guarda y avisa; la segunda vez lo revierte", () => {
    const almacen = almacenEnMemoria();
    const m = crear(almacen);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    m.control.alternarSilencio();
    expect(m.control.silenciado).toBe(true);
    expect(almacen.datos.get("prado:silencio")).toBe("1");
    expect(m.llamadas).toContain("silencio:true");
    m.control.alternarSilencio();
    expect(m.control.silenciado).toBe(false);
    expect(m.avisos).toEqual([true, false]);
  });

  it("la tecla M también avisa", () => {
    const m = crear(almacenEnMemoria());
    m.ventana.dispatchEvent(Object.assign(new Event("keydown"), { key: "m" }));
    expect(m.avisos).toEqual([true]);
  });

  it("activo es verdadero solo con el motor sonando", () => {
    const m = crear(almacenEnMemoria());
    expect(m.control.activo).toBe(false);
    m.ventana.dispatchEvent(new Event("pointerdown"));
    expect(m.control.activo).toBe(true);
  });
});
