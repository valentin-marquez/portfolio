import { useEffect, useRef } from "react";
import { Pane } from "tweakpane";
import { encuadres } from "@/features/camera-cuts/encuadres";
import { ajustesDireccion } from "./ajustes-direccion";

export type PalabrasEditables = { texto: string }[];

/**
 * Panel de dirección. Solo en desarrollo.
 *
 * Vive fuera del lienzo, en DOM, porque es mobiliario de taller y no parte de la
 * pieza — la regla de "todo se renderiza" vale para lo que se mira, no para los
 * mandos con los que se mira.
 */
export function PanelDireccion({
  palabras,
  alCambiarPalabras,
}: {
  palabras: PalabrasEditables;
  alCambiarPalabras: (palabras: PalabrasEditables) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  // el panel se construye una sola vez; para no reconstruirlo cuando cambian las
  // palabras, el callback se lee desde una referencia siempre al día
  const alCambiar = useRef(alCambiarPalabras);
  alCambiar.current = alCambiarPalabras;
  const iniciales = useRef(palabras);

  useEffect(() => {
    if (!contenedor.current) return;

    const pane = new Pane({ container: contenedor.current, title: "Dirección" });

    const mundo = pane.addFolder({ title: "Mundo gráfico" });
    mundo.addBinding(ajustesDireccion.mundo, "angulo", { min: 0, max: 90, step: 1 });
    mundo.addBinding(ajustesDireccion.mundo, "densidad", { min: 6, max: 90, step: 1 });
    mundo.addBinding(ajustesDireccion.mundo, "bandas");
    mundo.addBinding(ajustesDireccion.mundo, "semitono");
    mundo.addBinding(ajustesDireccion.mundo, "grano");
    mundo.addBinding(ajustesDireccion.mundo, "desregistro");

    const texto = pane.addFolder({ title: "Tipografía" });
    const borrador = iniciales.current.map((p) => ({ ...p }));
    borrador.forEach((palabra, i) => {
      texto
        .addBinding(palabra, "texto", { label: `palabra ${i + 1}` })
        .on("change", () => alCambiar.current(borrador.map((p) => ({ ...p }))));
    });

    const camara = pane.addFolder({ title: "Saltar a parada" });
    encuadres.forEach((encuadre, i) => {
      camara.addButton({ title: encuadre.nombre }).on("click", () => {
        const recorrido = document.documentElement.scrollHeight - window.innerHeight;
        // al centro de la franja de esa parada, no al borde
        window.scrollTo({ top: (recorrido * (i + 0.5)) / encuadres.length, behavior: "smooth" });
      });
    });

    return () => {
      pane.dispose();
    };
  }, []);

  return (
    <div
      ref={contenedor}
      style={{ position: "fixed", top: 12, right: 12, width: 290, zIndex: 10 }}
    />
  );
}
