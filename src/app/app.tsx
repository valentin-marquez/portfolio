import { Canvas } from "@react-three/fiber";
import { encuadrePorIndice, encuadres } from "@/features/camera-cuts/encuadres";
import { PlataformaCamara } from "@/features/camera-cuts/plataforma-camara";
import { useIndiceEncuadre } from "@/features/camera-cuts/use-indice-encuadre";
import {
  palabrasPorDefecto,
  TipografiaCompuesta,
} from "@/features/composed-type/tipografia-compuesta";
import { CapaRecortes } from "@/features/cut-out-shapes/capa-recortes";
import { SujetoProvisional } from "@/features/floating-subject/sujeto-provisional";
import { ajustesPorDefecto, MundoGrafico } from "@/features/graphic-world/mundo-grafico";
import { paleta } from "@/shared/paleta";

export function App() {
  const indice = useIndiceEncuadre();
  const encuadre = encuadrePorIndice(indice);

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
          <MundoGrafico ajustes={{ ...ajustesPorDefecto, fondo: paleta[encuadre.fondo] }} />
          <PlataformaCamara encuadre={encuadre} />
          <TipografiaCompuesta palabras={palabrasPorDefecto} />
          <SujetoProvisional />
          <CapaRecortes />
        </Canvas>
      </div>
      <div className="recorrido" style={{ height: `${encuadres.length * 100}vh` }} />
    </>
  );
}
