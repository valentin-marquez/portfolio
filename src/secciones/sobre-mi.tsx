import { Aparecer } from "./aparecer";

export function SobreMi() {
  return (
    <section
      aria-labelledby="titulo-sobre-mi"
      className="mx-auto w-[560px] max-w-[calc(100%-32px)] pt-16"
    >
      <Aparecer>
        <h2 id="titulo-sobre-mi" className="mb-4 text-sm font-medium text-enfasis">
          Sobre mí
        </h2>
        <p>
          Ingeniero en Ejecución en Informática, mención Desarrollo de Sistemas. Me gusta el
          software que se ve simple por fuera y está bien pensado por dentro.
        </p>
      </Aparecer>
    </section>
  );
}
