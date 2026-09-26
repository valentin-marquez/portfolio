import { type Experimento, experimentos } from "@/contenido/experimentos";
import { Aparecer } from "./aparecer";
import { MiniaturaExperimento01 } from "./miniatura-experimento-01";

export function Experimentos() {
  return (
    <section
      id="experimentos"
      aria-labelledby="titulo-experimentos"
      className="mx-auto w-[560px] max-w-[calc(100%-32px)] pt-14"
    >
      <Aparecer>
        <h2 id="titulo-experimentos" className="mb-4 text-sm font-medium text-enfasis">
          Experimentos
        </h2>
        <ul className="grid grid-cols-1 gap-[18px] min-[600px]:grid-cols-2">
          {experimentos.map((e) => (
            <li key={e.id}>
              <Tarjeta experimento={e} />
            </li>
          ))}
        </ul>
      </Aparecer>
    </section>
  );
}

const CLASE_MINIATURA =
  "aspect-[4/3] overflow-hidden rounded-[24px] bg-[#efebe1] ring-1 ring-black/[0.03]";

function Tarjeta({ experimento: e }: { experimento: Experimento }) {
  const pie = (
    <div className="mx-1 mt-2 flex justify-between text-[13px] text-enfasis">
      <span>{e.titulo}</span>
      <span className="font-mono text-xs text-meta">{e.anio}</span>
    </div>
  );
  if (!e.ruta) {
    return (
      <>
        <div className={CLASE_MINIATURA} />
        {pie}
      </>
    );
  }
  return (
    <a
      href={e.ruta}
      className="block rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
    >
      <div className={CLASE_MINIATURA}>
        <MiniaturaExperimento01 />
      </div>
      {pie}
    </a>
  );
}
