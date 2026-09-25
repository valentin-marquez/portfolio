// Blur progresivo en el borde de la pantalla: lo que entra o sale por arriba o por abajo se
// desenfoca de a poco. Son capas apiladas, cada una más desenfocada y más pegada al borde, más un velo
// crema muy leve. No captura el puntero.
const CAPAS = [0.5, 1, 2, 4, 8, 14];

export function BordeDifuso({ lado }: { lado: "arriba" | "abajo" }) {
  const hacia = lado === "arriba" ? "to top" : "to bottom";
  const paso = 100 / (CAPAS.length + 1);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 z-30 h-[88px] ${lado === "arriba" ? "top-0" : "bottom-0"}`}
    >
      {CAPAS.map((blur, i) => {
        const desde = i * paso;
        const mascara = `linear-gradient(${hacia}, transparent ${desde}%, #000 ${desde + paso}%, #000 ${desde + 2 * paso}%, transparent ${desde + 3 * paso}%)`;
        const ultima = i === CAPAS.length - 1;
        const mascaraFinal = `linear-gradient(${hacia}, transparent ${desde}%, #000 ${desde + paso}%)`;
        return (
          <div
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: ultima ? mascaraFinal : mascara,
              WebkitMaskImage: ultima ? mascaraFinal : mascara,
            }}
          />
        );
      })}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${hacia === "to top" ? "to bottom" : "to top"}, rgba(246, 243, 234, 0.55), rgba(246, 243, 234, 0))`,
        }}
      />
    </div>
  );
}
