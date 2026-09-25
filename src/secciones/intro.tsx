import { ConCalma } from "./con-calma";
import { Entrada } from "./entrada";
import { IconoDedalDeOro, IconoHoja, IconoVentana } from "./iconos-prado";
import { NombreConEdad } from "./nombre-con-edad";
import { PalabraViento } from "./palabra-viento";
import { GrupoViento } from "./rafaga-grupo";

// al pasar el mouse por el bloque, la ráfaga enciende las tres palabras con colores del prado:
// cielo, hoja y dedal de oro (AA sobre el fondo)
const CIELO = "#35709c";
const HOJA = "#52742e";
const DEDAL = "#b44f16";

export function Intro() {
  return (
    <section className="mx-auto w-[560px] max-w-[calc(100%-32px)] pt-9">
      <GrupoViento className="space-y-3.5">
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
          <p>
            Aquí guardo experimentos:{" "}
            <PalabraViento texto="interfaces" color={CIELO} Icono={IconoVentana} semilla={1} />,{" "}
            <PalabraViento texto="movimiento" color={HOJA} Icono={IconoHoja} semilla={2} /> y
            pequeñas piezas que se sienten{" "}
            <PalabraViento texto="vivas" color={DEDAL} Icono={IconoDedalDeOro} semilla={3} />.
          </p>
        </Entrada>
      </GrupoViento>
    </section>
  );
}
