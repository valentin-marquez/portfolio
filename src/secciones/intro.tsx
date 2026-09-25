import { Entrada } from "./entrada";

export function Intro() {
  return (
    <section className="mx-auto w-[560px] max-w-[calc(100%-32px)] space-y-3.5 pt-9">
      <Entrada retraso={0.8}>
        <p>Hola,</p>
      </Entrada>
      <Entrada retraso={0.95}>
        <h1 className="text-[15px] font-normal">
          Soy <span className="font-medium text-enfasis">Valentín</span>, ingeniero de sistemas.
          Construyo cosas{" "}
          <span className="font-mano text-[1.45em] leading-none text-acento">con calma</span> y con
          cuidado.
        </h1>
      </Entrada>
      <Entrada retraso={1.1}>
        <p>
          Aquí guardo experimentos: interfaces, movimiento y pequeñas piezas que se sienten vivas.
        </p>
      </Entrada>
    </section>
  );
}
