// Lista de experimentos. Los que tienen `ruta` ya viven en su propia página; el resto sigue como
// placeholder.
export interface Experimento {
  id: string;
  titulo: string;
  anio: number;
  ruta?: string;
}

export const experimentos: Experimento[] = [
  { id: "experimento-01", titulo: "Experimento 1", anio: 2026, ruta: "/experimento-01" },
  { id: "experimento-02", titulo: "Experimento 2", anio: 2026 },
  { id: "experimento-03", titulo: "Experimento 3", anio: 2026 },
  { id: "experimento-04", titulo: "Experimento 4", anio: 2026 },
];
