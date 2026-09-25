import { experimentos } from "@/contenido/experimentos";
import { Aparecer } from "./aparecer";

export function Experimentos() {
  return (
    <section
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
              <div className="aspect-[4/3] rounded-[24px] bg-[#efebe1] ring-1 ring-black/[0.03]" />
              <div className="mx-1 mt-2 flex justify-between text-[13px] text-enfasis">
                <span>{e.titulo}</span>
                <span className="font-mono text-xs text-meta">{e.anio}</span>
              </div>
            </li>
          ))}
        </ul>
      </Aparecer>
    </section>
  );
}
