// Panel para afinar el prado en vivo. Solo existe en desarrollo con ?debug: muta los mismos
// parámetros que lee el motor en cada cuadro. "Copiar parámetros" deja el JSON listo para
// congelarlo en crearParametros().
import { Pane } from "tweakpane";
import type { Parametros } from "@/prado/parametros";

const COLOR = { color: { type: "float" as const } };

export function abrirDepuracion(p: Parametros): () => void {
  // contenedor propio: fijo y por encima de la página (el de tweakpane es absoluto y quedaba
  // tapado por <main>: se veía pero no se podía tocar)
  const contenedor = document.createElement("div");
  contenedor.style.cssText =
    "position:fixed;top:12px;right:12px;z-index:60;width:280px;max-height:calc(100vh - 24px);overflow-y:auto";
  document.body.appendChild(contenedor);
  const panel = new Pane({ title: "prado", expanded: true, container: contenedor });
  panel.addBinding(p, "vista", { options: { final: 0, profundidad: 1, foco: 2, viento: 3 } });
  panel.addBinding(p, "movimiento", {
    label: "movimiento",
    options: { "mirar al cielo": "cielo", subir: "sube", avanzar: "avanza" },
  });

  const camara = panel.addFolder({ title: "cámara", expanded: false });
  camara.addBinding(p.camara, "altura", { min: 0.3, max: 5, step: 0.05 });
  camara.addBinding(p.camara, "mirarY", { min: -2, max: 2, step: 0.05 });
  camara.addBinding(p.camara, "mirarZ", { min: -40, max: -2, step: 0.5 });
  camara.addBinding(p.camara, "fov", { min: 10, max: 70, step: 1 });
  camara.addBinding(p.camara, "avance", { min: 0, max: 20, step: 0.1 });

  const pasto = panel.addFolder({ title: "pasto", expanded: true });
  pasto.addBinding(p.pasto, "curva", { min: 0, max: 1.5, step: 0.01 });
  pasto.addBinding(p.pasto, "torsion", { min: 0, max: 4, step: 0.05 });
  pasto.addBinding(p.pasto, "tonoBase", COLOR);
  pasto.addBinding(p.pasto, "tonoCuerpo", COLOR);
  pasto.addBinding(p.pasto, "tonoPunta", COLOR);
  pasto.addBinding(p.pasto, "tonoTallo", COLOR);
  pasto.addBinding(p.pasto, "tonoSuelo", COLOR);

  const luz = panel.addFolder({ title: "luz", expanded: false });
  luz.addBinding(p.luz, "sol");
  luz.addBinding(p.luz, "colorSol", COLOR);
  luz.addBinding(p.luz, "ambiente", COLOR);
  luz.addBinding(p.luz, "translucidez", { min: 0, max: 2, step: 0.01 });

  const viento = panel.addFolder({ title: "viento", expanded: false });
  viento.addBinding(p.viento, "escalaRuido", { min: 0.01, max: 1, step: 0.01 });
  viento.addBinding(p.viento, "fuerzaRuido", { min: 0, max: 1, step: 0.01 });
  viento.addBinding(p.viento, "fuerzaRafaga", { min: 0, max: 1.5, step: 0.01 });

  const foco = panel.addFolder({ title: "foco", expanded: false });
  foco.addBinding(p.foco, "distancia", { min: 1, max: 40, step: 0.1 });
  foco.addBinding(p.foco, "rango", { min: 0.5, max: 40, step: 0.1 });
  foco.addBinding(p.foco, "radioMax", { min: 0, max: 24, step: 0.5 });
  foco.addBinding(p.foco, "respiracion", { min: 0, max: 2, step: 0.01 });

  const atmosfera = panel.addFolder({ title: "atmósfera", expanded: false });
  atmosfera.addBinding(p.bruma, "color", { ...COLOR, label: "bruma" });
  atmosfera.addBinding(p.bruma, "densidad", { min: 0, max: 0.2, step: 0.001 });
  atmosfera.addBinding(p.cielo, "arriba", COLOR);
  atmosfera.addBinding(p.cielo, "horizonte", COLOR);
  atmosfera.addBinding(p.diente, "radioCabeza", { min: 0.01, max: 0.3, step: 0.005 });
  atmosfera.addBinding(p.borde, "x", { min: 0, max: 0.5, step: 0.01, label: "borde x" });
  atmosfera.addBinding(p.borde, "y", { min: 0, max: 0.5, step: 0.01, label: "borde y" });
  atmosfera.addBinding(p.borde, "ruido", { min: 0, max: 0.3, step: 0.005, label: "borde ruido" });
  atmosfera.addBinding(p, "grano", { min: 0, max: 0.2, step: 0.001 });

  panel.addButton({ title: "copiar parámetros" }).on("click", () => {
    void navigator.clipboard.writeText(JSON.stringify(p, null, 2));
  });

  // medidor de fps, discreto, abajo a la izquierda
  const fps = document.createElement("div");
  fps.style.cssText =
    "position:fixed;left:12px;bottom:12px;z-index:50;font:12px 'Source Code Pro',monospace;color:#9a9a8f";
  document.body.appendChild(fps);
  let cuadros = 0;
  let desde = performance.now();
  let raf = 0;
  const contar = (ahora: number) => {
    cuadros++;
    if (ahora - desde >= 500) {
      fps.textContent = `${Math.round((cuadros * 1000) / (ahora - desde))} fps`;
      cuadros = 0;
      desde = ahora;
    }
    raf = requestAnimationFrame(contar);
  };
  raf = requestAnimationFrame(contar);

  return () => {
    cancelAnimationFrame(raf);
    fps.remove();
    panel.dispose();
    contenedor.remove();
  };
}
