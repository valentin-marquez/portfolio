import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import { Entrada } from "./entrada";
import { VentanaPrado } from "./ventana-prado";

const alMontar = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoHero = prado;
  escena.elHero = elemento;
};

export function Hero() {
  return (
    <section aria-label="Un prado con viento" className="pt-[6vh]">
      <Entrada duracion={1.8} desenfoque={16} retraso={0.1}>
        <VentanaPrado alto="62vh" dientes={5} semilla={1} alMontar={alMontar} />
      </Entrada>
    </section>
  );
}
