import { ConCalma } from "./con-calma";
import { Entrada } from "./entrada";
import { IconoDedalDeOro, IconoHoja, IconoVentana } from "./iconos-prado";
import { NombreConEdad } from "./nombre-con-edad";
import { FraseViva, PalabraViva } from "./palabra-viva";

// al pasar el mouse por la frase se encienden sus tres palabras, con un color del prado:
// cielo, hoja y dedal de oro (AA sobre el fondo)
const CIELO = "#35709c";
const HOJA = "#52742e";
const DEDAL = "#b44f16";

export function Intro() {
  return (
    <section className="mx-auto w-[560px] max-w-[calc(100%-32px)] pt-9">
      <div className="space-y-3.5">
        <Entrada retraso={0.8}>
          <p>Hola,</p>
        </Entrada>
        <Entrada retraso={0.95}>
          <h1 className="text-[15px] font-normal">
            Soy <NombreConEdad />, ingeniero de sistemas. Construyo cosas{" "}
            <ConCalma className="font-mano text-[1.45em] leading-none text-acento" /> y con cuidado.
          </h1>
        </Entrada>
        <Entrada retraso={1.1}>
          <FraseViva>
            Aquí guardo experimentos:{" "}
            <PalabraViva texto="interfaces" color={CIELO} Icono={IconoVentana} />,{" "}
            <PalabraViva texto="movimiento" color={HOJA} Icono={IconoHoja} /> y pequeñas piezas que
            se sienten <PalabraViva texto="vivas" color={DEDAL} Icono={IconoDedalDeOro} />.
          </FraseViva>
        </Entrada>
      </div>
    </section>
  );
}
