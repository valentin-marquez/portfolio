// Íconos dibujados a mano para las palabras de la intro. Van a color; el blanco y negro en reposo lo
// pone quien los usa con un filtro, así cada ícono se dibuja una sola vez.

type Props = { className?: string };

/** interfaces: una ventana que da al prado, con un diente de león en la loma */
export function IconoVentana({ className }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="1.5" y="2.5" width="17" height="15" rx="3.2" fill="#35709c" />
      <rect x="3" y="6" width="14" height="10" rx="1.6" fill="#cfe2ee" />
      <path
        d="M3 13.4c3-2.4 6.3-2.3 8.8-1.1 2 .9 3.6.5 5.2-.4v2.5a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 14.4z"
        fill="#8fb069"
      />
      <path d="M12.9 12.6v-3.1" stroke="#6f8a4a" strokeWidth="0.6" strokeLinecap="round" />
      <circle cx="12.9" cy="9.1" r="1.25" fill="#fbfaf4" />
      <circle cx="4.5" cy="4.25" r="0.75" fill="#f6f3ea" />
      <circle cx="6.7" cy="4.25" r="0.75" fill="#f6f3ea" />
      <circle cx="8.9" cy="4.25" r="0.75" fill="#f6f3ea" />
    </svg>
  );
}

/** movimiento: una hoja llevada por dos hilos de viento */
export function IconoHoja({ className }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M1.2 6.4h6.6c1.5 0 2-1.6 1-2.3-.7-.5-1.7-.1-1.6.8"
        fill="none"
        stroke="#8db6cf"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M1 10h3.6" fill="none" stroke="#8db6cf" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.3 16.6C5.8 11 9.4 6.6 18 4.2c.4 7.6-4.1 12.1-11.7 12.4z" fill="#7da24a" />
      <path
        d="M6.3 16.6c3-3.4 6-6.9 10.4-11.5"
        fill="none"
        stroke="#52742e"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path d="M4.6 18.3l1.9-1.9" stroke="#52742e" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/** vivas: un dedal de oro, la flor naranja de los campos de acá */
export function IconoDedalDeOro({ className }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M10 18.8c0-3.4.3-5.2 0-7.2"
        fill="none"
        stroke="#6f8a4a"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M10.1 15.6c1.9-1.4 4.1-1.4 5.5-.6-1.7 1.5-3.8 1.7-5.5.6z" fill="#7da24a" />
      <path d="M9.9 14.3c-1.5-1-3.3-1-4.5-.3 1.4 1.2 3.1 1.3 4.5.3z" fill="#7da24a" />
      <path
        d="M3.8 5.2c.5 4.3 3 6.9 6.2 6.9s5.7-2.6 6.2-6.9c-2.1 1.4-4.2 1.3-6.2-.9-2 2.2-4.1 2.3-6.2.9z"
        fill="#dc6f24"
      />
      <path
        d="M6.9 5c0 4.1 1.4 6.8 3.1 6.9 1.7-.1 3.1-2.8 3.1-6.9-.9-1.7-2-2.5-3.1-2.9-1.1.4-2.2 1.2-3.1 2.9z"
        fill="#f29a3d"
      />
      <path d="M8.6 11.3c.6 1.1 2.2 1.1 2.8 0z" fill="#6f8a4a" />
    </svg>
  );
}
