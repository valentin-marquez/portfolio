import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FUENTES } from "./fuentes";

// Compila cada programa con glslangValidator (GLSL ES 3.00), el mismo dialecto que WebGL2.
const hayValidador = spawnSync("glslangValidator", ["--version"]).status === 0;
const dir = mkdtempSync(join(tmpdir(), "shaders-"));

function valida(nombre: string, etapa: "vert" | "frag", fuente: string) {
  const archivo = join(dir, `${nombre}.${etapa}`);
  writeFileSync(archivo, fuente);
  const r = spawnSync("glslangValidator", [archivo], { encoding: "utf8" });
  return { ok: r.status === 0, log: `${r.stdout}${r.stderr}` };
}

describe.skipIf(!hayValidador)("shaders", () => {
  for (const [nombre, programa] of Object.entries(FUENTES)) {
    for (const etapa of ["vert", "frag"] as const) {
      it(`${nombre}.${etapa} compila`, () => {
        const r = valida(nombre, etapa, programa[etapa]);
        expect(r.log).not.toMatch(/ERROR/);
        expect(r.ok).toBe(true);
      });
    }
  }
});

describe("reglas de los shaders", () => {
  it("nadie eleva al cuadrado con pow: es indefinido con base negativa en GLSL ES (usar x*x)", () => {
    for (const [nombre, programa] of Object.entries(FUENTES)) {
      for (const etapa of ["vert", "frag"] as const) {
        expect(programa[etapa], `${nombre}.${etapa}`).not.toMatch(/pow\([^;]*,\s*2\.0\s*\)/);
      }
    }
  });
});
