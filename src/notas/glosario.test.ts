import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { esTermino } from "./glosario";

const CARPETA = join(import.meta.dirname, "../../notas");

describe("glosario", () => {
  it("cada término marcado en las notas tiene su explicación", () => {
    const usados = readdirSync(CARPETA)
      .filter((f) => f.endsWith(".html"))
      .flatMap((f) => [...readFileSync(join(CARPETA, f), "utf8").matchAll(/data-t="([^"]+)"/g)])
      .map((m) => m[1]);
    expect(usados.length).toBeGreaterThan(0);
    expect(usados.filter((t) => !esTermino(t))).toEqual([]);
  });

  it("no confunde propiedades heredadas con términos", () => {
    expect(esTermino("toString")).toBe(false);
    expect(esTermino(undefined)).toBe(false);
  });
});
