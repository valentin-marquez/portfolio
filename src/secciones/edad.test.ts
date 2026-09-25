import { describe, expect, it } from "vitest";
import { edadEntre, enSantiago, formatearEdad, NACIMIENTO } from "./edad";

describe("edad", () => {
  it("cuenta por calendario, sin aproximar años de 365,25 días", () => {
    const e = edadEntre(NACIMIENTO, {
      año: 2026,
      mes: 9,
      dia: 25,
      hora: 17,
      minuto: 31,
      segundo: 5,
    });
    expect(e).toEqual({ años: 25, meses: 6, dias: 6, horas: 15, minutos: 31, segundos: 5 });
  });

  it("pide prestado en cadena: un segundo antes del cumpleaños todavía no cumple", () => {
    const e = edadEntre(NACIMIENTO, {
      año: 2026,
      mes: 3,
      dia: 19,
      hora: 1,
      minuto: 59,
      segundo: 59,
    });
    // del 19-02 a las 02:00 al 19-03 a la 01:59:59 van 27 días (febrero de 2026 tiene 28)
    expect(e).toEqual({ años: 24, meses: 11, dias: 27, horas: 23, minutos: 59, segundos: 59 });
  });

  it("nacer un 31 no deja días negativos en los meses cortos", () => {
    const e = edadEntre(
      { año: 2000, mes: 1, dia: 31, hora: 0, minuto: 0, segundo: 0 },
      { año: 2000, mes: 3, dia: 1, hora: 0, minuto: 0, segundo: 0 },
    );
    // el mes de febrero se cierra en su último día: 1 mes, y el 1 de marzo es un día más
    expect(e).toEqual({ años: 0, meses: 1, dias: 1, horas: 0, minutos: 0, segundos: 0 });
  });

  it("lee la hora de pared de Santiago, con su horario de verano", () => {
    // septiembre de 2026: Chile ya está en UTC-3
    expect(enSantiago(new Date("2026-09-25T20:31:05Z"))).toEqual({
      año: 2026,
      mes: 9,
      dia: 25,
      hora: 17,
      minuto: 31,
      segundo: 5,
    });
  });

  it("formatea en dos líneas y respeta el singular", () => {
    expect(
      formatearEdad({ años: 25, meses: 6, dias: 6, horas: 15, minutos: 3, segundos: 5 }),
    ).toEqual({ calendario: "25 años, 6 meses y 6 días", reloj: "15 h 03 min 05 s" });
    expect(
      formatearEdad({ años: 1, meses: 1, dias: 1, horas: 1, minutos: 0, segundos: 0 }),
    ).toEqual({ calendario: "1 año, 1 mes y 1 día", reloj: "1 h 00 min 00 s" });
  });
});
