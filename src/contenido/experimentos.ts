// Lista de experimentos. Por ahora son placeholders; cada uno podrá ser un componente vivo o un video.
export interface Experimento {
  id: string;
  titulo: string;
  anio: number;
}

export const experimentos: Experimento[] = [
  { id: "experimento-01", titulo: "Experimento 01", anio: 2026 },
  { id: "experimento-02", titulo: "Experimento 02", anio: 2026 },
  { id: "experimento-03", titulo: "Experimento 03", anio: 2026 },
  { id: "experimento-04", titulo: "Experimento 04", anio: 2026 },
];
