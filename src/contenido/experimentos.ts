// Lista de experimentos: cada uno vive en su propia página y la portada muestra un cuadro suyo.
export interface Experimento {
  id: string;
  titulo: string;
  anio: number;
  ruta: string;
  imagen: string;
}

export const experimentos: Experimento[] = [
  {
    id: "experimento-01",
    titulo: "Experimento 1",
    anio: 2026,
    ruta: "/experimento-01",
    // el gólem de hierro ofreciendo la amapola (?t=10.8 en su página)
    imagen: "/recursos/experimento-01/tarjeta.webp",
  },
];
