// La cumbia de la página: Web Audio con el FLAC en loop exacto. Implementa el MotorSonido del sitio
// para compartir su política (primer gesto, tecla M, pestaña oculta) y da su posición como reloj de
// la animación.
import type { MotorSonido } from "@/audio/control";
import { type FuenteTiempo, posicionEnLoop } from "./reloj";

export interface MotorCumbia extends MotorSonido, FuenteTiempo {
  /** volumen de 0 a 1; el silencio lo sigue decidiendo fijarSilencio */
  fijarVolumen(v: number): void;
}

export function crearMotorCumbia(dep: {
  url: string;
  desde: () => number;
  volumen: number;
}): MotorCumbia | null {
  if (typeof AudioContext === "undefined") return null;
  // a 48 kHz, la frecuencia del archivo: el loop cae exacto a la muestra
  const ctx = new AudioContext({ sampleRate: 48000 });
  const ganancia = ctx.createGain();
  ganancia.connect(ctx.destination);
  let fuente: AudioBufferSourceNode | null = null;
  let inicio = 0;
  let duracion = 0;
  let destruido = false;
  let volumen = dep.volumen;
  let mudo = false;
  const aplicar = () => ganancia.gain.setTargetAtTime(mudo ? 0 : volumen, ctx.currentTime, 0.04);

  const empezar = (buffer: AudioBuffer) => {
    if (destruido) return;
    duracion = buffer.duration;
    // arranca desde donde va la animación, así el cambio de reloj no se nota
    const desde = posicionEnLoop(dep.desde(), 0, duracion);
    fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    fuente.loop = true;
    fuente.connect(ganancia);
    fuente.start(ctx.currentTime, desde);
    inicio = ctx.currentTime - desde;
  };

  return {
    arrancar(silenciado) {
      mudo = silenciado;
      ganancia.gain.value = silenciado ? 0 : volumen;
      void ctx.resume();
      fetch(dep.url)
        .then((r) => r.arrayBuffer())
        .then((datos) => ctx.decodeAudioData(datos))
        .then(empezar)
        .catch((e) => console.warn("la cumbia no cargó:", e));
    },
    fijarViento() {},
    soplo() {},
    fijarSilencio(silenciado) {
      mudo = silenciado;
      aplicar();
    },
    fijarVolumen(v) {
      volumen = v;
      aplicar();
    },
    suspender() {
      void ctx.suspend();
    },
    reanudar() {
      void ctx.resume();
    },
    sonando: () => ctx.state === "running",
    posicion() {
      if (!fuente || ctx.state !== "running") return null;
      // lo que se ve tiene que coincidir con lo que se oye: se descuenta la latencia de salida
      const latencia = ctx.outputLatency || ctx.baseLatency || 0;
      return posicionEnLoop(ctx.currentTime - latencia, inicio, duracion);
    },
    destruir() {
      destruido = true;
      fuente?.stop();
      void ctx.close();
    },
  };
}
