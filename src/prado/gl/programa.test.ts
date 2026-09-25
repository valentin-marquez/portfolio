import { describe, expect, it } from "vitest";
import { numerarLineas } from "./programa";

describe("numerarLineas", () => {
  it("numera desde 1 para leer los errores del compilador de shaders", () => {
    expect(numerarLineas("a\nb")).toBe("   1| a\n   2| b");
  });
});
