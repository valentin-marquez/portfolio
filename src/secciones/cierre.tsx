import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import type { Parametros } from "@/prado/parametros";
import type { Diente } from "@/prado/pasto";
import { RelojSantiago } from "./reloj-santiago";
import { VentanaPrado } from "./ventana-prado";

const alMontar = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoCierre = prado;
  escena.elCierre = elemento;
};

// una sola flor grande, a la derecha, sola entre el pasto. En una ventana angosta (un teléfono
// vertical) la cámara ve poco a los lados: la flor se corre hacia el centro para no quedar fuera
const aspectoCierre =
  typeof window === "undefined"
    ? 2
    : Math.min(1000, window.innerWidth - 32) / Math.max(1, window.innerHeight * 0.58);
const X_FLOR = 0.4 * Math.min(1, aspectoCierre / 2.6);
const FLOR: Diente[] = [{ x: X_FLOR, z: -2.8, altura: 0.78 }];
const DISTANCIA_FLOR = Math.hypot(X_FLOR, 2.8);
// foco poco profundo sobre la flor: el pasto de adelante y de atrás se desenfoca, como de cerca
const FOCO = { distancia: DISTANCIA_FLOR, rango: 1.5, radioMax: 14, respiracion: 0.12 };
// de cerca caben menos: un par de mariposas que buscan la flor y unas pocas hojas, todas cerca del
// plano de foco (fuera de él el desenfoque las borraría)
const VOLADORES = { mariposas: 2, hojas: 4, cerca: 2, lejos: 3.8 };
// cámara baja y lente más cerrado, a la altura de la flor
const camaraFlor = (base: Parametros["camara"]): Parametros["camara"] => ({
  ...base,
  fov: 20,
  altura: 0.86,
  mirarY: 0.3,
});

export function Cierre() {
  return (
    <footer className="pt-24">
      <VentanaPrado
        alto="58vh"
        dientes={FLOR}
        semilla={2}
        foco={FOCO}
        radioCabeza={0.14}
        voladores={VOLADORES}
        alMontar={alMontar}
        ajustarCamara={camaraFlor}
      />
      <div className="mx-auto flex w-[560px] max-w-[calc(100%-32px)] items-baseline justify-between pt-6 pb-20">
        <span>nos vemos</span>
        <RelojSantiago />
      </div>
    </footer>
  );
}
