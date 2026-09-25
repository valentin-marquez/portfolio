import { useEffect, useState } from "react";
import { escena } from "@/estado/escena";
import type { Prado } from "@/prado/motor";
import { formatearHora } from "./reloj";
import { VentanaPrado } from "./ventana-prado";

const alMontar = (prado: Prado | null, elemento: HTMLDivElement | null) => {
  escena.pradoCierre = prado;
  escena.elCierre = elemento;
};

function Reloj() {
  const [hora, setHora] = useState(() => formatearHora(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setHora(formatearHora(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="font-mono text-xs text-meta">santiago · {hora}</span>;
}

export function Cierre() {
  return (
    <footer className="pt-24">
      <VentanaPrado alto="46vh" dientes={3} semilla={2} alMontar={alMontar} />
      <div className="mx-auto flex w-[560px] max-w-[calc(100%-32px)] items-baseline justify-between pt-6 pb-20">
        <span>nos vemos</span>
        <Reloj />
      </div>
    </footer>
  );
}
