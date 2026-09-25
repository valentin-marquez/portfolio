import { describe, expect, it } from "vitest";
import { type Almacen, crearControlAudio, type MotorSonido } from "./control";

function motorFalso() {
  const llamadas: string[] = [];
  const motor: MotorSonido = {
    arrancar: (s) => llamadas.push(`arrancar:${s}`),
    fijarViento: (i) => llamadas.push(`viento:${i.toFixed(2)}`),
    fijarSilencio: (s) => llamadas.push(`silencio:${s}`),
    suspender: () => llamadas.push("suspender"),
    reanudar: () => llamadas.push("reanudar"),
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

function montar(almacen: Almacen | null = almacenEnMemoria()) {
  const { motor, llamadas } = motorFalso();
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
    expect(m.llamadas).toEqual(["arrancar:false", "viento:0.50"]);
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
});
