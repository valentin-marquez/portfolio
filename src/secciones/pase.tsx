// El pase de un trabajo: una credencial de plástico colgada de su cinta, con el logo del lugar, el
// nombre de la empresa, el cargo, la firma y una banda de color con el periodo y el código.
// Es solo dibujo: quien lo usa decide si es un botón o una ilustración.
import type { ColorPase, Trabajo } from "@/contenido/trabajos";
import { barras, numeroPase, periodo } from "@/contenido/trabajos";
import { CIELO, DEDAL, HOJA } from "./colores-prado";
import { LOGOS } from "./logos-trabajos";

export const COLOR: Record<ColorPase, string> = { hoja: HOJA, cielo: CIELO, dedal: DEDAL };

/** el pase mide lo que una credencial real, en proporción (54 × 86 mm) */
export const ANCHO_PASE = 168;

export function Cinta({ trabajo, alto }: { trabajo: Trabajo; alto: string }) {
  return (
    <span
      aria-hidden="true"
      className="cinta absolute bottom-[calc(100%-4px)] left-1/2 w-5 -translate-x-1/2 overflow-hidden"
      style={{ height: alto, backgroundColor: COLOR[trabajo.color] }}
    >
      <span className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] leading-none tracking-[0.08em] text-fondo/75 [writing-mode:vertical-rl]">
        {`${trabajo.cinta}   `.repeat(12)}
      </span>
    </span>
  );
}

export function Pase({ trabajo, activo }: { trabajo: Trabajo; activo: boolean }) {
  const color = COLOR[trabajo.color];
  return (
    <span
      data-pase
      className="pase relative flex h-[266px] flex-col overflow-hidden rounded-[14px] bg-plastico text-left"
      style={{ width: ANCHO_PASE }}
    >
      <span
        aria-hidden="true"
        className="absolute top-[11px] left-1/2 h-[7px] w-[34px] -translate-x-1/2 rounded-[4px] bg-fondo shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)]"
      />
      <span className="flex flex-1 flex-col px-3.5 pt-[30px]">
        <span className="flex justify-between font-mono text-[10px] leading-[14px] text-meta">
          <span>pase</span>
          <span>nº {numeroPase(trabajo)}</span>
        </span>
        {/* cada logo impreso en su recuadro blanco, como en una credencial */}
        <span aria-hidden="true" className="mt-3 flex gap-1.5">
          {(LOGOS[trabajo.id] ?? []).map((logo) => (
            <span
              key={logo.clave}
              className="grid size-[46px] place-items-center rounded-[10px] bg-white ring-1 ring-enfasis/[0.07]"
            >
              {logo.dibujo(activo)}
            </span>
          ))}
        </span>
        <span className="mt-3 text-[20px] leading-6 font-medium tracking-[-0.01em] text-enfasis">
          {trabajo.empresa}
        </span>
        <span className="mt-1 text-xs leading-4">{trabajo.rolPase ?? trabajo.rol}</span>
        <span aria-hidden="true" className="mt-auto pb-2">
          <span className="block origin-left -rotate-3 font-mano text-[22px] leading-5 text-[#3d3d36]">
            Valentín
          </span>
          <span className="mt-0.5 block h-px bg-enfasis/12" />
        </span>
      </span>
      <span
        className="relative flex h-14 flex-col justify-between overflow-hidden px-3.5 py-2 text-fondo/92"
        style={{ backgroundColor: color }}
      >
        <span className="font-mono text-[10px] leading-3">{periodo(trabajo)}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          className="h-[18px] w-full opacity-85"
          fill="currentColor"
        >
          {barras(trabajo.id).map(([x, ancho]) => (
            <rect key={x} x={x} width={ancho} height="20" />
          ))}
        </svg>
        <span
          data-escaner
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-transparent via-white/45 to-transparent opacity-0"
        />
      </span>
    </span>
  );
}

/** La argolla metálica que une la cinta con la ranura del pase. */
export function Argolla() {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-3.5 left-1/2 z-[2] h-6 w-3 -translate-x-1/2 rounded-[3px] bg-linear-to-r from-[#a9a79e] via-[#e9e7e0] to-[#8e8c84] shadow-[0_1px_1px_rgb(0_0_0/0.2)]"
    />
  );
}
