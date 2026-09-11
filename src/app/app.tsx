import { Canvas } from "@react-three/fiber";
import { ajustesPorDefecto, MundoGrafico } from "@/features/graphic-world/mundo-grafico";

export function App() {
  return (
    <Canvas
      // el presupuesto de píxeles está limitado a propósito: el post-procesado es
      // lo caro de esta pieza, no el mundo gráfico
      dpr={[1, 1.75]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <MundoGrafico ajustes={ajustesPorDefecto} />
    </Canvas>
  );
}
