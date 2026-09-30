import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { eventosEntre, suena } from "./sonido";
import { tiempoReal } from "./tiempo";

const tabla = suena([13.8, 14.0]);

describe("sonido", () => {
  it("cada archivo de la tabla existe en public y no sobra ninguno", () => {
    const hay = new Set(
      readdirSync("public/experimento-01/sonidos").map((f) => f.replace(/\.mp3$/, "")),
    );
    const usados = new Set(tabla.flatMap(([, s]) => s.archivos));
    for (const a of usados) expect(hay.has(a), a).toBe(true);
    for (const a of hay) expect(usados.has(a), `sobra ${a}`).toBe(true);
  });

  it("recorrer el tiempo en ventanas seguidas toca cada sonido una sola vez", () => {
    let contados = 0;
    for (let t = -0.001; t < 16; t += 1 / 60) contados += eventosEntre(tabla, t, t + 1 / 60).length;
    expect(contados).toBe(tabla.length);
  });

  it("el clic suena en t = 0 al arrancar desde −1", () => {
    expect(eventosEntre(tabla, -1, 0).some((s) => s.archivos.includes("Click"))).toBe(true);
  });

  it("nada suena a jugador: ni daño por caída ni subir de nivel", () => {
    const todos = tabla.flatMap(([, s]) => s.archivos).join(" ");
    expect(todos).not.toMatch(/Fallbig|Random_levelup/);
  });

  it("el flechazo usa el daño y el crujido del propio gólem", () => {
    const ahora = eventosEntre(tabla, tiempoReal(11.85), tiempoReal(11.95)).flatMap(
      (s) => s.archivos,
    );
    expect(ahora).toEqual(expect.arrayContaining(["Iron_golem_hurt1", "Iron_golem_damage1"]));
  });
});
