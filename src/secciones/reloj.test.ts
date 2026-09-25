import { describe, expect, it } from "vitest";
import { formatearHora } from "./reloj";

describe("formatearHora", () => {
  it("muestra la hora de Santiago en verano (UTC−3)", () => {
    expect(formatearHora(new Date("2026-01-15T12:00:00Z"))).toBe("09:00:00");
  });

  it("muestra la hora de Santiago en invierno (UTC−4)", () => {
    expect(formatearHora(new Date("2026-07-15T12:00:05Z"))).toBe("08:00:05");
  });

  it("usa 24 horas", () => {
    expect(formatearHora(new Date("2026-01-15T20:30:00Z"))).toBe("17:30:00");
  });
});
