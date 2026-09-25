import {
  createContext,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { sentidoActual } from "@/prado/viento";

export interface Rafaga {
  activo: boolean;
  /** hacia dónde cruza la ola: el sentido del viento del prado al momento de entrar */
  sentido: 1 | -1;
  /** la caja del grupo al entrar; cada palabra se ubica dentro de ella para saber cuándo le llega */
  caja: DOMRect | null;
}

const Contexto = createContext<Rafaga>({ activo: false, sentido: 1, caja: null });

export const useRafaga = () => useContext(Contexto);

/**
 * Un bloque de texto que recibe la ráfaga entera: al pasar el mouse por cualquier parte, la ola lo
 * cruza en el sentido del viento y enciende a la vez todas las palabras que lleva dentro.
 */
export function GrupoViento({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const soltar = useRef(0);
  const [rafaga, setRafaga] = useState<Rafaga>({ activo: false, sentido: 1, caja: null });

  useEffect(() => () => window.clearTimeout(soltar.current), []);

  const entrar = () =>
    setRafaga({
      activo: true,
      sentido: sentidoActual(),
      caja: ref.current?.getBoundingClientRect() ?? null,
    });
  const salir = () => setRafaga((r) => ({ ...r, activo: false }));
  const conMouse = (e: PointerEvent) => e.pointerType !== "touch";

  return (
    <Contexto.Provider value={rafaga}>
      <div
        ref={ref}
        className={className}
        onPointerEnter={(e) => conMouse(e) && entrar()}
        onPointerLeave={(e) => conMouse(e) && salir()}
        // en pantallas táctiles no hay hover: un toque trae la ráfaga y se calma sola
        onPointerDown={(e) => {
          if (conMouse(e)) return;
          entrar();
          window.clearTimeout(soltar.current);
          soltar.current = window.setTimeout(salir, 2800);
        }}
      >
        {children}
      </div>
    </Contexto.Provider>
  );
}
