import { describe, expect, it } from "vitest";
import {
  ATERRIZAJE,
  actualizarSemillas,
  crearSemillas,
  DESPEGUE,
  desprendimiento,
  type Entorno,
  faseSegun,
  MAXIMO_DESPRENDIDO,
  type Semilla,
  semillaCercana,
  suavizarDesprendimiento,
  umbralDespegue,
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
    zonaSalida: null,
    puntero: null,
    sentido: 1,
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

describe("reparto de las semillas en vuelo", () => {
  it("sean cuantas sean, en vuelo se reparten en toda la altura y no se amontonan arriba", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0.5, 20);
    const ys = s.map((x) => x.y / 900);
    expect(Math.max(...ys)).toBeGreaterThan(0.6);
    expect(Math.min(...ys)).toBeLessThan(0.4);
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

describe("las semillas salen de las flores del hero con el scroll", () => {
  // el hero: ahí están las flores y las semillas pueden verse aunque caigan sobre la columna
  const hero = { left: 220, top: 100, width: 1000, height: 400 };

  it("se desprenden de a una a lo largo del primer tramo del scroll", () => {
    const n = 6;
    const umbrales = Array.from({ length: n }, (_, i) => umbralDespegue(i, n));
    expect(umbrales[0]).toBeCloseTo(DESPEGUE);
    expect(umbrales[n - 1]).toBeCloseTo(0.12);
    for (let i = 1; i < n; i++) expect(umbrales[i]).toBeGreaterThan(umbrales[i - 1] as number);
  });

  it("a mitad del tramo, unas ya volaron y las demás siguen en su flor", () => {
    const s = crearSemillas(6, 1);
    const medio = (umbralDespegue(2, 6) + umbralDespegue(3, 6)) / 2;
    simular(s, medio, 1, { zonaSalida: hero });
    expect(s.map((x) => x.fase)).toEqual(["vuelo", "vuelo", "vuelo", "reposo", "reposo", "reposo"]);
  });

  it("avisa una sola vez cuándo y de qué flor se suelta cada semilla", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0, 1, { zonaSalida: hero });
    const primera = actualizarSemillas(s, entorno(umbralDespegue(0, 6), { zonaSalida: hero }));
    expect(primera).toEqual([{ indice: 0, origen: { x: 500, y: 300 }, radio: 12 }]);
    expect(actualizarSemillas(s, entorno(umbralDespegue(0, 6), { zonaSalida: hero }))).toEqual([]);
  });

  it("se la ve salir de su flor: aparece ahí mismo y se va con el viento", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0, 1, { zonaSalida: hero });
    simular(s, umbralDespegue(0, 6), 0.4, { zonaSalida: hero, sentido: 1 });
    const x = s[0] as Semilla;
    expect(x.alfa).toBeGreaterThan(0.25);
    // la flor está en (500, 300): la semilla salió hacia donde sopla, sin alejarse de golpe
    expect(x.x).toBeGreaterThan(500);
    expect(Math.hypot(x.x - 500, x.y - 300)).toBeLessThan(120);
  });

  it("sale del tamaño de su flor y crece mientras vuela hacia la cámara", () => {
    const s = crearSemillas(6, 1);
    const conRadio = [{ x: 500, y: 300, radio: 8 }, ...entorno(0).origenes.slice(1)];
    simular(s, 0, 1, { zonaSalida: hero, origenes: conRadio });
    simular(s, umbralDespegue(0, 6), 0.1, { zonaSalida: hero, origenes: conRadio });
    const x = s[0] as Semilla;
    expect(x.tam * x.escala).toBeLessThanOrEqual(8 * 1.3 + 1);
    simular(s, umbralDespegue(0, 6), 3, { zonaSalida: hero, origenes: conRadio });
    expect(x.escala).toBeGreaterThan(0.97);
  });

  it("al volver arriba regresa visible hasta su flor y recién ahí se oculta", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0.5, 10, { zonaSalida: hero });
    simular(s, 0, 0.6, { zonaSalida: hero });
    const lejos = s.filter((x) => Math.hypot(x.x - 500, x.y - 300) > 80 && x.indice % 3 === 0);
    for (const x of lejos) expect(x.alfa).toBeGreaterThan(0.1);
    simular(s, 0, 20, { zonaSalida: hero });
    for (const x of s) expect(x.alfa).toBeLessThan(0.02);
  });
});

describe("desprendimiento de cada flor", () => {
  const origenes = [
    { x: 500, y: 300 },
    { x: 720, y: 280 },
    { x: 940, y: 310 },
  ];

  it("con todas sus semillas fuera, cada flor pierde lo máximo y no queda pelada", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0.5, 5);
    const d = desprendimiento(s, origenes, false);
    expect(d).toEqual([MAXIMO_DESPRENDIDO, MAXIMO_DESPRENDIDO, MAXIMO_DESPRENDIDO]);
    expect(MAXIMO_DESPRENDIDO).toBeLessThan(0.6);
  });

  it("pierde en proporción a las semillas que ya se fueron", () => {
    const s = crearSemillas(6, 1);
    simular(s, umbralDespegue(0, 6), 1);
    // la semilla 0 es de la flor 0, que tiene dos (la 0 y la 3)
    expect(desprendimiento(s, origenes, false)).toEqual([MAXIMO_DESPRENDIDO / 2, 0, 0]);
  });

  it("se vuelve a llenar cuando sus semillas llegan de vuelta, no antes", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0.5, 10);
    simular(s, 0, 0.3);
    expect(desprendimiento(s, origenes, false)[0]).toBeGreaterThan(0);
    simular(s, 0, 20);
    expect(desprendimiento(s, origenes, false)).toEqual([0, 0, 0]);
  });

  it("con movimiento reducido las flores no se deshacen", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0.5, 5, { reducir: true });
    expect(desprendimiento(s, origenes, true)).toEqual([0, 0, 0]);
  });

  it("se deshace rápido y se rellena más despacio", () => {
    const d = [0];
    suavizarDesprendimiento(d, [0.4], 0.3);
    expect(d[0]).toBeGreaterThan(0.3);
    const r = [0.4];
    suavizarDesprendimiento(r, [0], 0.3);
    expect(r[0]).toBeGreaterThan(0.15);
  });
});

describe("el puntero sopla las semillas del costado", () => {
  function enCarril() {
    const s = crearSemillas(6, 1);
    simular(s, 0.5, 15);
    return s;
  }

  /** Dos prados iguales; en uno, un gesto de 600 px/s pasa rozando la primera semilla. */
  function conYSinGesto() {
    const con = enCarril();
    const sin = enCarril();
    const x = con[0] as Semilla;
    const inicio = { x: x.x, y: x.y };
    for (let i = 0; i < 12; i++) {
      const puntero = { x: inicio.x - 60 + i * 10, y: inicio.y + 10, vx: 600, vy: 0 };
      actualizarSemillas(con, entorno(0.5, { puntero, tiempo: 15 + i / 60 }));
      actualizarSemillas(sin, entorno(0.5, { tiempo: 15 + i / 60 }));
    }
    const distancia = () =>
      Math.hypot(
        (con[0] as Semilla).x - (sin[0] as Semilla).x,
        (con[0] as Semilla).y - (sin[0] as Semilla).y,
      );
    const seguir = (segundos: number) => {
      simular(con, 0.5, segundos);
      simular(sin, 0.5, segundos);
    };
    return { con, sin, distancia, seguir };
  }

  it("un gesto que pasa cerca la empuja hacia donde va la mano", () => {
    const { con, sin, seguir } = conYSinGesto();
    seguir(0.3);
    expect((con[0] as Semilla).x - (sin[0] as Semilla).x).toBeGreaterThan(25);
  });

  it("después vuelve despacio a su carril", () => {
    const { distancia, seguir } = conYSinGesto();
    seguir(1);
    expect(distancia()).toBeGreaterThan(15);
    seguir(12);
    expect(distancia()).toBeLessThan(3);
  });

  it("un puntero quieto o lejos no la mueve", () => {
    const quieto = enCarril();
    const lejos = enCarril();
    const referencia = enCarril();
    const a = quieto[0] as Semilla;
    const puntero = { x: a.x + 20, y: a.y, vx: 0, vy: 0 };
    simular(quieto, 0.5, 1, { puntero });
    const p2 = { x: a.x + 400, y: a.y, vx: 900, vy: 0 };
    simular(lejos, 0.5, 1, { puntero: p2 });
    simular(referencia, 0.5, 1);
    expect(quieto[0]?.x).toBeCloseTo(referencia[0]?.x as number, 3);
    expect(lejos[0]?.x).toBeCloseTo(referencia[0]?.x as number, 3);
  });

  it("con movimiento reducido no se empujan", () => {
    const s = crearSemillas(6, 1);
    simular(s, 0.5, 5, { reducir: true });
    const x = s[0] as Semilla;
    const antes = x.x;
    simular(s, 0.5, 1, { reducir: true, puntero: { x: x.x - 10, y: x.y, vx: 900, vy: 0 } });
    expect(x.x).toBe(antes);
  });
});
