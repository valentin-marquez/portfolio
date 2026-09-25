import { describe, expect, it } from "vitest";
import {
  ATERRIZAJE,
  actualizarSemillas,
  crearSemillas,
  DESPEGUE,
  type Entorno,
  faseSegun,
  type Semilla,
  semillaCercana,
  zonasLaterales,
} from "./semillas";

function entorno(progreso: number, extra: Partial<Entorno> = {}): Entorno {
  return {
    progreso,
    tiempo: 0,
    dt: 1 / 60,
    viento: 0.2,
    ancho: 1440,
    alto: 900,
    columna: 560,
    origenes: [
      { x: 500, y: 300 },
      { x: 720, y: 280 },
      { x: 940, y: 310 },
    ],
    destinos: [
      { x: 600, y: 700 },
      { x: 800, y: 720 },
    ],
    zonaAterrizaje: { left: 220, top: 600, width: 1000, height: 200 },
    reducir: false,
    ...extra,
  };
}

function simular(s: Semilla[], progreso: number, segundos: number, extra: Partial<Entorno> = {}) {
  for (let i = 0; i < segundos * 60; i++)
    actualizarSemillas(s, entorno(progreso, { ...extra, tiempo: i / 60 }));
}

describe("faseSegun", () => {
  it("reposo, vuelo y aterrizaje según el progreso", () => {
    expect(faseSegun(0)).toBe("reposo");
    expect(faseSegun(DESPEGUE + 0.01)).toBe("vuelo");
    expect(faseSegun(ATERRIZAJE + 0.01)).toBe("aterrizaje");
  });
});

describe("zonasLaterales", () => {
  it("en escritorio deja dos márgenes fuera de la columna", () => {
    const z = zonasLaterales(1440, 560);
    expect(z).toHaveLength(2);
    const [izq, der] = z as [[number, number], [number, number]];
    expect(izq[1]).toBeLessThanOrEqual(720 - 280 - 24);
    expect(der[0]).toBeGreaterThanOrEqual(720 + 280 + 24);
  });

  it("en móvil no hay margen útil", () => {
    expect(zonasLaterales(390, 560)).toHaveLength(0);
  });
});

describe("actualizarSemillas", () => {
  it("crea entre 6 y 10 semillas", () => {
    expect(crearSemillas(8, 1)).toHaveLength(8);
  });

  it("en reposo están ocultas sobre su diente de león", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0, 3);
    for (const x of s) expect(x.alfa).toBeLessThan(0.02);
  });

  it("en vuelo nunca quedan visibles detrás del texto", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 20);
    const centro = 720;
    for (const x of s) {
      const detrasDelTexto = Math.abs(x.x - centro) < 280 + 24;
      if (detrasDelTexto) expect(x.alfa).toBeLessThan(0.02);
      else expect(x.alfa).toBeGreaterThan(0.1);
    }
  });

  it("en pantalla angosta se vuelven invisibles durante el vuelo", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 10, { ancho: 390 });
    for (const x of s) expect(x.alfa).toBeLessThan(0.02);
  });

  it("si el progreso salta de 0 a 1 terminan en los destinos, sin valores inválidos", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0, 1);
    simular(s, 1, 30);
    for (const x of s) {
      expect(Number.isFinite(x.x) && Number.isFinite(x.y)).toBe(true);
      const cerca = [
        { x: 600, y: 700 },
        { x: 800, y: 720 },
      ].some((d) => Math.hypot(d.x - x.x, d.y - x.y) < 40);
      expect(cerca).toBe(true);
      expect(x.fase).toBe("aterrizaje");
    }
  });

  it("al volver arriba regresan a reposo y se ocultan (el diente se regenera)", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 10);
    simular(s, 0, 20);
    for (const x of s) {
      expect(x.fase).toBe("reposo");
      expect(x.alfa).toBeLessThan(0.02);
    }
  });
});

describe("actualizarSemillas en móvil y con movimiento reducido", () => {
  it("en móvil, al aterrizar, no pasan visibles sobre el texto antes de entrar al prado del cierre", () => {
    const cierre = { left: 16, top: 900, width: 358, height: 380 }; // bajo el pliegue: alto 844
    const destinos = [
      { x: 120, y: 1150 },
      { x: 260, y: 1160 },
    ];
    // en móvil los orígenes (cabezas de los dientes de león del hero) caen dentro de los 390 px
    const origenes = [
      { x: 110, y: 300 },
      { x: 200, y: 280 },
      { x: 290, y: 310 },
    ];
    const movil = { ancho: 390, alto: 844, origenes };
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 5, { ...movil, destinos, zonaAterrizaje: cierre });
    for (let i = 0; i < 600; i++) {
      // el visitante sigue bajando: el prado del cierre sube hacia la vista
      const z = { ...cierre, top: cierre.top - i * 0.8 };
      const d = destinos.map((p) => ({ x: p.x, y: p.y - i * 0.8 }));
      actualizarSemillas(
        s,
        entorno(0.9, { ...movil, zonaAterrizaje: z, destinos: d, tiempo: i / 60 }),
      );
      for (const x of s) {
        const dentro =
          x.x >= z.left && x.x <= z.left + z.width && x.y >= z.top && x.y <= z.top + z.height;
        if (!dentro) expect(x.alfa).toBeLessThan(0.02);
      }
    }
  });

  it("con movimiento reducido no viajan: quedan quietas en su destino y solo cambia la opacidad", () => {
    const s = crearSemillas(8, 1);
    simular(s, 0.5, 5, { reducir: true });
    actualizarSemillas(s, entorno(1, { reducir: true, tiempo: 5 }));
    const destinos = [
      { x: 600, y: 700 },
      { x: 800, y: 720 },
    ];
    for (const x of s) {
      const d = destinos[x.indice % 2] as { x: number; y: number };
      expect(x.x).toBe(d.x);
      expect(x.y).toBe(d.y);
    }
    const antes = s.map((x) => ({ x: x.x, y: x.y, alfa: x.alfa }));
    simular(s, 1, 2, { reducir: true });
    s.forEach((x, i) => {
      const a = antes[i] as { x: number; y: number; alfa: number };
      expect(x.x).toBe(a.x);
      expect(x.y).toBe(a.y);
      expect(x.alfa).toBeGreaterThan(a.alfa);
    });
  });
});

describe("semillaCercana", () => {
  it("entra y sale con un fundido, sin aparecer de golpe", () => {
    expect(semillaCercana(0.001, 0.03).alfa).toBeLessThan(0.02);
    expect(semillaCercana(2.4, 0.03).alfa).toBeGreaterThan(0.3);
    expect(semillaCercana(4.79, 0.03).alfa).toBeLessThan(0.02);
  });

  it("solo cruza mientras el hero está a la vista", () => {
    let alguna = false;
    for (let t = 0; t < 30; t += 0.1) if (semillaCercana(t, 0.03).activa) alguna = true;
    expect(alguna).toBe(true);
    for (let t = 0; t < 30; t += 0.1) expect(semillaCercana(t, 0.3).activa).toBe(false);
  });
});
