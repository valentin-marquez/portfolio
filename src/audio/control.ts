// Cuándo suena el ambiente: arranca con el primer gesto (política de autoplay), la tecla M silencia y
// lo recuerda, y con la pestaña oculta se suspende. No hay UI visible.
//
// En pantallas táctiles el pointerdown no activa el audio (el navegador recién da permiso en el
// pointerup, touchend o click), así que en cada gesto se reintenta reanudar hasta que suene.

export interface MotorSonido {
  arrancar(silenciado: boolean): void;
  /** intensidad 0..1 y frente de la ola (x de pantalla 0..1) para el paneo */
  fijarViento(intensidad: number, frente: number): void;
  fijarSilencio(silenciado: boolean): void;
  suspender(): void;
  reanudar(): void;
  /** un soplo corto y suave, paneado hacia donde está la flor (-1 izquierda, 1 derecha) */
  soplo(paneo: number): void;
  /** el contexto de audio está corriendo (no suspendido por el navegador) */
  sonando(): boolean;
  destruir(): void;
}

export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

const CLAVE = "prado:silencio";
const GESTOS = ["pointerdown", "pointerup", "click", "touchend"] as const;
const UMBRAL_VIENTO = 0.01;
const UMBRAL_FRENTE = 0.02;

function leerSilencio(almacen: Almacen | null): boolean {
  try {
    return almacen?.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

function guardarSilencio(almacen: Almacen | null, silenciado: boolean) {
  try {
    almacen?.setItem(CLAVE, silenciado ? "1" : "0");
  } catch {
    // sin almacenamiento, la preferencia dura solo esta visita
  }
}

export function crearControlAudio(dep: {
  crearMotor: () => MotorSonido | null;
  almacen: Almacen | null;
  ventana: EventTarget;
  documento: EventTarget & { hidden: boolean };
  /** avisa cada vez que cambia el silencio (tecla M o alternarSilencio) */
  alCambiar?: (silenciado: boolean) => void;
}) {
  let motor: MotorSonido | null = null;
  let intentado = false;
  let silenciado = leerSilencio(dep.almacen);
  let viento = 0;
  let frente = 0.5;
  let vientoEnviado = Number.NaN;
  let frenteEnviado = Number.NaN;

  const enviarViento = () => {
    if (!motor) return;
    motor.fijarViento(viento, frente);
    vientoEnviado = viento;
    frenteEnviado = frente;
  };

  const alternar = () => {
    silenciado = !silenciado;
    guardarSilencio(dep.almacen, silenciado);
    motor?.fijarSilencio(silenciado);
    dep.alCambiar?.(silenciado);
  };

  const arrancar = () => {
    if (intentado) return;
    intentado = true;
    motor = dep.crearMotor();
    if (!motor) return;
    motor.arrancar(silenciado);
    enviarViento();
    if (dep.documento.hidden) motor.suspender();
  };

  const alGesto = () => {
    if (!motor) {
      arrancar();
      return;
    }
    if (!dep.documento.hidden && !motor.sonando()) motor.reanudar();
  };
  const alTecla = (ev: Event) => {
    const k = ev as KeyboardEvent;
    const destino = k.target as { tagName?: string; isContentEditable?: boolean } | null;
    const escribiendo =
      destino?.tagName === "INPUT" ||
      destino?.tagName === "TEXTAREA" ||
      destino?.isContentEditable === true;
    const conModificador = k.ctrlKey || k.metaKey || k.altKey;
    if (!escribiendo && !conModificador && (k.key === "m" || k.key === "M")) alternar();
    alGesto();
  };
  const alVisibilidad = () => {
    if (!motor) return;
    if (dep.documento.hidden) motor.suspender();
    else motor.reanudar();
  };

  for (const gesto of GESTOS) dep.ventana.addEventListener(gesto, alGesto);
  dep.ventana.addEventListener("keydown", alTecla);
  dep.documento.addEventListener("visibilitychange", alVisibilidad);

  return {
    fijarViento(intensidad: number, frenteOla = 0.5) {
      viento = intensidad;
      frente = frenteOla;
      const cambio =
        Number.isNaN(vientoEnviado) ||
        Math.abs(viento - vientoEnviado) >= UMBRAL_VIENTO ||
        Math.abs(frente - frenteEnviado) >= UMBRAL_FRENTE;
      if (cambio) enviarViento();
    },
    soplo(paneo: number) {
      motor?.soplo(Math.max(-1, Math.min(1, paneo)));
    },
    get silenciado() {
      return silenciado;
    },
    alternarSilencio: alternar,
    /** el motor existe y el navegador lo deja sonar */
    get activo() {
      return motor?.sonando() ?? false;
    },
    destruir() {
      for (const gesto of GESTOS) dep.ventana.removeEventListener(gesto, alGesto);
      dep.ventana.removeEventListener("keydown", alTecla);
      dep.documento.removeEventListener("visibilitychange", alVisibilidad);
      motor?.destruir();
      motor = null;
    },
  };
}
