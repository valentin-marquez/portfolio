import { useEffect, useState } from "react";
import { formatearHora } from "./reloj";

export function RelojSantiago() {
  const [hora, setHora] = useState(() => formatearHora(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setHora(formatearHora(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="font-mono text-xs text-meta">santiago · {hora}</span>;
}
