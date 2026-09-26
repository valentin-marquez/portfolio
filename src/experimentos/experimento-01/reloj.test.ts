import { describe, expect, it } from "vitest";
import { crearReloj, posicionEnLoop } from "./reloj";

describe("posicionEnLoop", () => {
  it("envuelve y descuenta el inicio", () => {
    expect(posicionEnLoop(12, 2, 20)).toBe(10);
    expect(posicionEnLoop(25, 2, 20)).toBe(3);
    expect(posicionEnLoop(1, 2, 20)).toBe(19);
  });
});

describe("crearReloj", () => {
  const falso = () => {
    let ahora = 100;
    return {
      ahora: () => ahora,
      avanzar: (s: number) => {
        ahora += s;
      },
    };
  };

  it("sin fuente corre con el reloj del navegador desde 0", () => {
    const n = falso();
    const r = crearReloj(n.ahora);
    expect(r.t()).toBe(0);
    n.avanzar(1.5);
    expect(r.t()).toBe(1.5);
  });

  it("fijar, pausar y reanudar sin saltos", () => {
    const n = falso();
    const r = crearReloj(n.ahora);
    r.fijar(4);
    n.avanzar(1);
    expect(r.t()).toBe(5);
    r.pausar();
    n.avanzar(10);
    expect(r.t()).toBe(5);
    expect(r.pausado).toBe(true);
    r.reanudar();
    n.avanzar(0.5);
    expect(r.t()).toBe(5.5);
  });

  it("con fuente sigue su posición, y si la fuente se calla continúa desde ahí", () => {
    const n = falso();
    const r = crearReloj(n.ahora);
    let posicion: number | null = 7;
    r.conectar({ posicion: () => posicion });
    expect(r.t()).toBe(7);
    posicion = null;
    n.avanzar(0.25);
    expect(r.t()).toBe(7.25);
  });

  it("pausado ignora la fuente", () => {
    const n = falso();
    const r = crearReloj(n.ahora);
    r.fijar(3);
    r.pausar();
    r.conectar({ posicion: () => 9 });
    expect(r.t()).toBe(3);
  });
});
