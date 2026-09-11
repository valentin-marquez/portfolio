import { encuadres } from "@/features/camera-cuts/encuadres";

/**
 * La pieza entera se renderiza en WebGL, y eso tiene un peaje: nada de lo que se
 * ve existe para el teclado, para un lector de pantalla ni para un buscador.
 *
 * Esta capa es el contrapeso. Lleva los mismos controles y el mismo texto que la
 * escena, en DOM de verdad: botones que reciben foco y navegan, y las palabras
 * como texto seleccionable. Está oculta a la vista pero no a la accesibilidad —
 * `display: none` la sacaría también del árbol de accesibilidad, que es justo lo
 * contrario de lo que hace falta.
 */
export function CapaAccesible({
  palabras,
  indiceActual,
}: {
  palabras: readonly string[];
  indiceActual: number;
}) {
  function saltarA(indice: number) {
    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: (recorrido * (indice + 0.5)) / encuadres.length,
      behavior: "smooth",
    });
  }

  return (
    <div className="solo-lectores">
      <h1>Pieza</h1>

      <nav aria-label="Paradas del recorrido">
        <ul>
          {encuadres.map((encuadre, i) => (
            <li key={encuadre.nombre}>
              <button
                aria-current={i === indiceActual ? "true" : undefined}
                onClick={() => saltarA(i)}
                type="button"
              >
                {encuadre.nombre}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p>{palabras.join(" ")}</p>
    </div>
  );
}
