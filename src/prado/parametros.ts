import type { Vec3 } from "./camara";

export type Color = { r: number; g: number; b: number };

// Todo lo afinable del prado en un solo objeto. El panel de depuración lo muta en vivo y el motor lo
// lee en cada cuadro; cuando el look esté cerrado, los valores de aquí son los definitivos.
export interface Parametros {
  /** avance: cuánto camina la cámara hacia adentro del prado (m), para las coreografías de scroll */
  camara: { altura: number; mirarY: number; mirarZ: number; fov: number; avance: number };
  pasto: {
    alturaMin: number;
    alturaMax: number;
    ancho: number;
    curva: number;
    torsion: number;
    zCerca: number;
    zLejos: number;
    tonoBase: Color;
    tonoCuerpo: Color;
    tonoPunta: Color;
    tonoTallo: Color;
    tonoSuelo: Color;
  };
  luz: { sol: Vec3; colorSol: Color; ambiente: Color; translucidez: number };
  viento: { escalaRuido: number; fuerzaRuido: number; fuerzaRafaga: number };
  foco: { distancia: number; rango: number; radioMax: number; respiracion: number };
  bruma: { color: Color; densidad: number };
  cielo: { arriba: Color; horizonte: Color };
  diente: { radioCabeza: number };
  borde: { x: number; y: number; ruido: number };
  grano: number;
  /** 0 final, 1 profundidad, 2 círculo de confusión, 3 campo de viento */
  vista: number;
  /** cómo se mueve la cámara del hero al scrollear (variante 1) */
  movimiento: "cielo" | "sube" | "avanza";
}

export function crearParametros(): Parametros {
  return {
    camara: { altura: 1.6, mirarY: 0.3, mirarZ: -12, fov: 30, avance: 0 },
    pasto: {
      alturaMin: 0.28,
      alturaMax: 0.7,
      ancho: 0.026,
      curva: 0.35,
      torsion: 1.2,
      zCerca: 2.5,
      zLejos: 70,
      tonoBase: { r: 0.2, g: 0.27, b: 0.13 },
      tonoCuerpo: { r: 0.46, g: 0.56, b: 0.33 },
      tonoPunta: { r: 0.64, g: 0.68, b: 0.42 },
      tonoTallo: { r: 0.4, g: 0.47, b: 0.3 },
      tonoSuelo: { r: 0.55, g: 0.6, b: 0.42 },
    },
    luz: {
      sol: { x: 0.35, y: 0.25, z: -1 },
      colorSol: { r: 1, g: 0.93, b: 0.78 },
      ambiente: { r: 0.5, g: 0.54, b: 0.45 },
      translucidez: 0.35,
    },
    viento: { escalaRuido: 0.18, fuerzaRuido: 0.22, fuerzaRafaga: 0.3 },
    foco: { distancia: 8, rango: 9, radioMax: 9, respiracion: 0.35 },
    bruma: { color: { r: 0.93, g: 0.92, b: 0.86 }, densidad: 0.045 },
    // arriba, el cielo tiene casi el tono de la página: al mirar hacia arriba el prado se funde con ella
    cielo: { arriba: { r: 0.958, g: 0.952, b: 0.925 }, horizonte: { r: 0.97, g: 0.95, b: 0.89 } },
    diente: { radioCabeza: 0.07 },
    borde: { x: 0.16, y: 0.22, ruido: 0.06 },
    grano: 0.035,
    vista: 0,
    movimiento: "cielo",
  };
}
