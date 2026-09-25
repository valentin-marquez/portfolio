// Edad contada por calendario en hora de Santiago: lo que uno dice al decir "tengo 25 años y 6 meses".

/** Una hora de pared: año, mes (1–12), día, hora, minuto y segundo. */
export interface Instante {
  año: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
}

export interface Edad {
  años: number;
  meses: number;
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

/** 19 de marzo de 2001, 02:00 en Santiago. */
export const NACIMIENTO: Instante = { año: 2001, mes: 3, dia: 19, hora: 2, minuto: 0, segundo: 0 };

const formato = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

export function enSantiago(fecha: Date): Instante {
  const partes = Object.fromEntries(
    formato.formatToParts(fecha).map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;
  return {
    año: partes.year ?? 0,
    mes: partes.month ?? 0,
    dia: partes.day ?? 0,
    hora: partes.hour ?? 0,
    minuto: partes.minute ?? 0,
    segundo: partes.second ?? 0,
  };
}

function diasDelMes(año: number, mes: number): number {
  return new Date(Date.UTC(año, mes, 0)).getUTCDate();
}

/** Resta de horas de pared pidiendo prestado de unidad en unidad, como se hace a mano. */
export function edadEntre(desde: Instante, hasta: Instante): Edad {
  let prestamo = 0;
  const restar = (a: number, b: number, base: number) => {
    const v = a - b - prestamo;
    prestamo = v < 0 ? 1 : 0;
    return v < 0 ? v + base : v;
  };
  // el mes anterior se cierra en su último día aunque sea más corto que el día de nacimiento
  const mesAnterior = hasta.mes === 1 ? 12 : hasta.mes - 1;
  const añoAnterior = hasta.mes === 1 ? hasta.año - 1 : hasta.año;
  const largoMes = Math.max(diasDelMes(añoAnterior, mesAnterior), desde.dia);

  const segundos = restar(hasta.segundo, desde.segundo, 60);
  const minutos = restar(hasta.minuto, desde.minuto, 60);
  const horas = restar(hasta.hora, desde.hora, 24);
  const dias = restar(hasta.dia, desde.dia, largoMes);
  const meses = restar(hasta.mes, desde.mes, 12);
  return { años: hasta.año - desde.año - prestamo, meses, dias, horas, minutos, segundos };
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const dos = (n: number) => String(n).padStart(2, "0");

export function formatearEdad(e: Edad): { calendario: string; reloj: string } {
  return {
    calendario: `${plural(e.años, "año", "años")}, ${plural(e.meses, "mes", "meses")} y ${plural(e.dias, "día", "días")}`,
    reloj: `${e.horas} h ${dos(e.minutos)} min ${dos(e.segundos)} s`,
  };
}
