import { describe, expect, it } from "vitest";
import { rafagaDelPrado } from "@/prado/motor";
import { vientoDelLatido } from "./escena";

describe("un solo viento", () => {
  it("el latido (audio y semillas) sigue exactamente la ráfaga que ve el pasto", () => {
    for (let t = 0; t < 3600; t += 0.37) {
      expect(vientoDelLatido(t * 1000, 0)).toBeCloseTo(rafagaDelPrado(t * 1000).fuerza, 12);
    }
  });
});
