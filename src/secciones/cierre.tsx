import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import { RelojSantiago } from "./reloj-santiago";
import { VentanaPrado } from "./ventana-prado";

const alMontar = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoCierre = prado;
  escena.elCierre = elemento;
};

export function Cierre() {
  return (
    <footer className="pt-24">
      <VentanaPrado alto="46vh" dientes={3} semilla={2} alMontar={alMontar} />
      <div className="mx-auto flex w-[560px] max-w-[calc(100%-32px)] items-baseline justify-between pt-6 pb-20">
        <span>nos vemos</span>
        <RelojSantiago />
      </div>
    </footer>
  );
}
