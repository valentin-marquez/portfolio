// Los trabajos, uno por pase. Fechas como "aaaa-mm"; sin `hasta`, el trabajo sigue vigente.
export type ColorPase = "hoja" | "cielo" | "dedal";

export interface Trabajo {
  id: string;
  /** como va impreso en el pase */
  empresa: string;
  /** la línea completa en el detalle */
  organizacion: string;
  rol: string;
  /** el cargo en el pase, si el completo no cabe */
  rolPase?: string;
  desde: string;
  hasta?: string;
  lugar?: string;
  color: ColorPase;
  /** lo que va impreso en la cinta */
  cinta: string;
  resumen: string;
  puntos: string[];
  herramientas: string[];
  enlace?: { texto: string; url: string };
}

export const trabajos: Trabajo[] = [
  {
    id: "fao",
    empresa: "FAO",
    organizacion: "FAO Chile, junto al Ministerio del Medio Ambiente",
    rol: "Especialista en Tecnologías de la Información",
    rolPase: "Especialista en TI",
    desde: "2026-04",
    lugar: "Santiago, híbrido",
    color: "hoja",
    cinta: "fao chile",
    resumen:
      "Llevo la parte de tecnología de dos proyectos de cambio climático: CBIT-2, que fortalece el marco de transparencia de las NDC, y el de Soluciones Basadas en la Naturaleza.",
    puntos: [
      "Desarrollo y mejoro la plataforma de seguimiento de los Instrumentos de Gestión del Cambio Climático, dentro del SNAICC.",
      "Levanto requerimientos, implemento las mejoras y reviso la calidad del código.",
      "Superviso la plataforma de aprendizaje virtual, en Moodle, del programa nacional de capacitación en Soluciones Basadas en la Naturaleza.",
      "Capacito a los equipos del ministerio y a quienes usan la plataforma.",
    ],
    herramientas: ["Desarrollo web", "gestión de requisitos", "Moodle", "metodologías ágiles"],
  },
  {
    id: "framerate",
    empresa: "Framerate.cl",
    organizacion: "Framerate.cl, como independiente",
    rol: "Ingeniero de software y desarrollador principal",
    desde: "2024-05",
    lugar: "Remoto",
    color: "cielo",
    cinta: "framerate.cl",
    resumen:
      "Un comparador de precios de hardware para las tiendas de Chile. Lo diseñé y lo construyo de punta a punta, con la arquitectura pensada para crecer y responder rápido.",
    puntos: [
      "Arquitectura modular en Turborepo: scraping en Docker, una API pública serverless en Cloudflare Workers y el frontend con renderizado en el servidor.",
      "Normalización automática de especificaciones técnicas que llegan de muchas tiendas, con LLMs y expresiones regulares.",
      "Los servicios críticos corren en Bun con Hono, para responder rápido con mucha concurrencia.",
      "PostgreSQL en Supabase con Row Level Security estricto, para que cada dato quede protegido y aislado.",
    ],
    herramientas: [
      "TypeScript",
      "Bun",
      "Hono",
      "Cloudflare Workers",
      "Docker",
      "PostgreSQL",
      "Supabase",
    ],
    enlace: { texto: "framerate.cl", url: "https://framerate.cl" },
  },
  {
    id: "bipsolar-expedio",
    empresa: "Bipsolar y Expedio",
    organizacion: "Bipsolar y Expedio",
    rol: "Ingeniero de soporte",
    desde: "2024-03",
    hasta: "2025-05",
    color: "dedal",
    cinta: "bipsolar expedio",
    resumen:
      "Soporte para sistemas críticos de logística y energía: que siguieran funcionando y que los procesos internos se vieran con claridad.",
    puntos: [
      "Mantenimiento preventivo y correctivo para asegurar la continuidad de sistemas críticos.",
      "Resolución de incidentes de hardware y software de nivel 1 y 2, con tickets y soporte a usuarios.",
      "Mejoras en los sistemas de reportes administrativos, que hicieron más transparentes los procesos internos.",
      "Evaluación técnica de equipos IoT y de movilidad urbana antes de ponerlos en operación.",
    ],
    herramientas: ["Soporte técnico", "mantenimiento", "IoT", "reportes"],
  },
];

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function mes(fecha: string): string {
  const [anio, m] = fecha.split("-");
  return `${MESES[Number(m) - 1]} ${anio}`;
}

/** "a, b y c" */
export function enumerar(cosas: string[]): string {
  return cosas.length < 2 ? (cosas[0] ?? "") : `${cosas.slice(0, -1).join(", ")} y ${cosas.at(-1)}`;
}

/** "abr 2026 a hoy" o "mar 2024 a may 2025" */
export function periodo(t: Pick<Trabajo, "desde" | "hasta">): string {
  return `${mes(t.desde)} a ${t.hasta ? mes(t.hasta) : "hoy"}`;
}

/** el número del pase: mes y año de entrada, "0426" para abril de 2026 */
export function numeroPase(t: Pick<Trabajo, "desde">): string {
  const [anio = "", m = ""] = t.desde.split("-");
  return `${m}${anio.slice(2)}`;
}

/** Barras del código del pase, siempre las mismas para el mismo texto: [x, ancho] en 0..100. */
export function barras(texto: string): Array<[number, number]> {
  let h = 2166136261;
  const salida: Array<[number, number]> = [];
  let x = 0;
  for (let i = 0; x < 100; i++) {
    h ^= texto.charCodeAt(i % texto.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    const ancho = 0.8 + (h % 4) * 0.7;
    salida.push([x, Math.min(ancho, 100 - x)]);
    x += ancho + 0.9 + ((h >> 3) % 3) * 0.6;
  }
  return salida;
}
