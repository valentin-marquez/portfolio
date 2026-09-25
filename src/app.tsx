import { useEffect, useRef } from "react";
import { elegirCalidad } from "./prado/calidad";
import { montarPrado } from "./prado/motor";
import { crearParametros } from "./prado/parametros";

// Montaje provisional para ver el motor mientras se arma la página (Tarea 10 lo reemplaza).
const parametros = crearParametros();

export function App() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const prado = montarPrado(canvas, {
      semilla: 1,
      dientes: 5,
      parametros,
      calidad: elegirCalidad({
        anchoCss: innerWidth,
        dpr: devicePixelRatio || 1,
        nucleos: navigator.hardwareConcurrency || 4,
      }),
      reducirMovimiento: false,
    });
    return () => prado?.destruir();
  }, []);
  return (
    <main>
      <div className="mx-auto mt-[6vh] h-[62vh] w-[min(1000px,calc(100%-32px))]">
        <canvas ref={ref} className="block h-full w-full" />
      </div>
      <p className="mx-auto mt-10 w-[560px] max-w-[calc(100%-32px)]">
        Hola, soy <span className="text-enfasis font-medium">Valentín</span>.
      </p>
    </main>
  );
}
