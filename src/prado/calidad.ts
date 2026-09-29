export interface Calidad {
  nivel: "alta" | "media" | "baja";
  hojas: number;
  dprMax: number;
  msaa: number;
  muestrasDof: number;
  /**
   * el camino de los teléfonos: profundidad de campo barata (desenfoque a media resolución mezclado
   * según la distancia), una octava de ruido menos en el viento y las nubes, hojas de menos segmentos y
   * pasto hasta 35 m (más allá la bruma ya lo cubre)
   */
  ligera: boolean;
}

const NIVELES: Record<Calidad["nivel"], Calidad> = {
  alta: { nivel: "alta", hojas: 60000, dprMax: 2, msaa: 4, muestrasDof: 48, ligera: false },
  media: { nivel: "media", hojas: 30000, dprMax: 1.5, msaa: 4, muestrasDof: 32, ligera: false },
  baja: { nivel: "baja", hojas: 14000, dprMax: 1.25, msaa: 0, muestrasDof: 20, ligera: true },
};

export function elegirCalidad(e: { anchoCss: number; dpr: number; nucleos: number }): Calidad {
  if (e.anchoCss < 700 || e.nucleos <= 4) return { ...NIVELES.baja };
  if (e.anchoCss >= 1280 && e.nucleos >= 8) return { ...NIVELES.alta };
  return { ...NIVELES.media };
}
