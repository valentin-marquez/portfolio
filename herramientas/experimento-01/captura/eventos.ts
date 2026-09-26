// Exporta los eventos de sonido del guion (con su instante) para la mezcla de audio. Se corre con
// bun: el guion es TypeScript puro, no hace falta navegador.
import { mkdir, writeFile } from "node:fs/promises";
import { sonidos } from "../../../src/experimentos/experimento-01/guion";

const ruta = new URL("../salida/eventos.json", import.meta.url);
await mkdir(new URL(".", ruta), { recursive: true });
const eventos = sonidos();
await writeFile(ruta, `${JSON.stringify(eventos, null, 2)}\n`);
console.log(`${eventos.length} eventos → ${ruta.pathname}`);
