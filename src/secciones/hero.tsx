import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import { VentanaPrado } from "./ventana-prado";

const alMontar = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoHero = prado;
  escena.elHero = elemento;
};

export function Hero() {
  return (
    <section aria-label="Un prado con viento" className="pt-[6vh]">
      <VentanaPrado alto="62vh" dientes={5} semilla={1} alMontar={alMontar} />
    </section>
  );
}
