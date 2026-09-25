import { Aparecer } from "./aparecer";

export function Intro() {
  return (
    <section className="mx-auto w-[560px] max-w-[calc(100%-32px)] pt-9">
      <Aparecer className="space-y-3.5">
        <p>Hola,</p>
        <h1 className="text-[15px] font-normal">
          Soy <span className="font-medium text-enfasis">Valentín</span>, ingeniero de sistemas.
          Construyo cosas{" "}
          <span className="font-mano text-[1.45em] leading-none text-acento">con calma</span> y con
          cuidado.
        </h1>
        <p>
          Aquí guardo experimentos: interfaces, movimiento y pequeñas piezas que se sienten vivas.
        </p>
      </Aparecer>
    </section>
  );
}
