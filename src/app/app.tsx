import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { encuadrePorIndice, encuadres } from "@/features/camera-cuts/encuadres";
import { PlataformaCamara } from "@/features/camera-cuts/plataforma-camara";
import { useIndiceEncuadre } from "@/features/camera-cuts/use-indice-encuadre";
import {
  palabrasPorDefecto,
  TipografiaCompuesta,
} from "@/features/composed-type/tipografia-compuesta";
import { CapaRecortes } from "@/features/cut-out-shapes/capa-recortes";
import { PanelDireccion } from "@/features/direction-panel/panel-direccion";
import { SondaDev } from "@/features/direction-panel/sonda-dev";
import { SujetoFlotante } from "@/features/floating-subject/sujeto-flotante";
import { MundoGrafico } from "@/features/graphic-world/mundo-grafico";
import { paleta } from "@/shared/paleta";
import { CapaAccesible } from "./capa-accesible";

export function App() {
  const indice = useIndiceEncuadre();
  const encuadre = encuadrePorIndice(indice);
  const [textos, setTextos] = useState(() => palabrasPorDefecto.map((p) => ({ texto: p.texto })));

  // Las etiquetas del menú son maniquí, igual que las palabras grandes: qué dicen
  // depende del concepto (decisión abierta #1). Nombrar la parada a la que llevan
  // es al menos honesto sobre lo que hace el botón.
  const etiquetasMenu = useMemo(() => encuadres.map((e) => e.nombre), []);

  // Las palabras son lo único del panel que sí pasa por React: cambiar el texto
  // obliga a regenerar la textura, y eso es un efecto, no una lectura por fotograma.
  const palabras = useMemo(
    () =>
      palabrasPorDefecto.map((palabra, i) => ({
        ...palabra,
        texto: textos[i]?.texto ?? palabra.texto,
      })),
    [textos],
  );

  return (
    <>
      <div className="lienzo-fijo">
        <Canvas
          camera={{ fov: 38, near: 0.1, far: 40 }}
          // el presupuesto de píxeles está limitado a propósito: el post-procesado es
          // lo caro de esta pieza, no el mundo gráfico
          dpr={[1, 1.75]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
        >
          <MundoGrafico fondo={paleta[encuadre.fondo]} />
          <PlataformaCamara encuadre={encuadre} />
          <TipografiaCompuesta palabras={palabras} />
          <SujetoFlotante />
          <CapaRecortes clave={indice} etiquetas={etiquetasMenu} />
          {import.meta.env.DEV && <SondaDev />}
        </Canvas>
      </div>

      <CapaAccesible indiceActual={indice} palabras={palabras.map((p) => p.texto)} />

      <div className="recorrido" style={{ height: `${encuadres.length * 100}vh` }} />

      {import.meta.env.DEV && <PanelDireccion alCambiarPalabras={setTextos} palabras={textos} />}
    </>
  );
}
