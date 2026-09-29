// Medidor de ?rendimiento: para ver en un teléfono de verdad cuántos cuadros sostiene el prado, a qué
// nivel de calidad llegó, con qué resolución interna dibuja y en qué GPU. No se ve sin el parámetro.
import { useEffect, useState } from "react";
import { nivelActual, rendimiento } from "@/prado/ritmo";

function nombreGpu(): string {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "sin WebGL2";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const nombre = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return String(nombre);
  } catch {
    return "?";
  }
}

export function Medidor() {
  const [gpu] = useState(nombreGpu);
  const [hz, setHz] = useState(0);
  const [, refrescar] = useState(0);

  useEffect(() => {
    // la frecuencia de la pantalla: cuántos cuadros entrega el navegador por segundo
    let raf = 0;
    let cuenta = 0;
    let desde = performance.now();
    const contar = (ahora: number) => {
      cuenta++;
      if (ahora - desde >= 1000) {
        setHz(Math.round((cuenta * 1000) / (ahora - desde)));
        cuenta = 0;
        desde = ahora;
      }
      raf = requestAnimationFrame(contar);
    };
    raf = requestAnimationFrame(contar);
    const id = window.setInterval(() => refrescar((n) => n + 1), 500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, []);

  const nivel = nivelActual();
  return (
    <div className="pointer-events-none fixed bottom-2 left-2 z-50 max-w-[calc(100%-16px)] rounded-md bg-enfasis/85 px-2.5 py-1.5 font-mono text-[11px] leading-4 text-fondo">
      <div>
        prado {rendimiento.fps} fps · pantalla {hz} Hz
      </div>
      <div>
        nivel {rendimiento.nivel}: {nivel.fps} fps, {Math.round(nivel.escala * 100)} % resolución
      </div>
      <div>
        {rendimiento.resolucion} · dpr {window.devicePixelRatio} · {rendimiento.hojas} hojas
      </div>
      <div className="truncate">{gpu}</div>
    </div>
  );
}
