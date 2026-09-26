// El audio de la página: dos loops en Web Audio del mismo largo exacto, los sonidos de la interfaz y
// la cumbia, que arrancan juntos y quedan en fase. Los efectos suenan desde el primer gesto; la cumbia
// espera muda hasta que la animación aprieta play. Implementa el MotorSonido del sitio para compartir
// su política (primer gesto, tecla M, pestaña oculta) y da su posición como reloj de la animación.
import type { MotorSonido } from "@/audio/control";
import { type FuenteTiempo, posicionEnLoop } from "./reloj";

export interface MotorCumbia extends MotorSonido, FuenteTiempo {
  /** volumen de 0 a 1; el silencio lo sigue decidiendo fijarSilencio */
  fijarVolumen(v: number): void;
  /** entra la cumbia (con un fade corto); una vez que entra, se queda */
  activarMusica(): void;
}

/** lo que tarda la cumbia en entrar, en segundos (constante de tiempo del fade) */
const ENTRADA_MUSICA = 0.08;

export function crearMotorCumbia(dep: {
  efectos: string;
  musica: string;
  desde: () => number;
  volumen: number;
}): MotorCumbia | null {
  if (typeof AudioContext === "undefined") return null;
  // a 48 kHz, la frecuencia de los archivos: el loop cae exacto a la muestra
  const ctx = new AudioContext({ sampleRate: 48000 });
  const ganancia = ctx.createGain();
  ganancia.connect(ctx.destination);
  const puertaMusica = ctx.createGain();
  puertaMusica.gain.value = 0;
  puertaMusica.connect(ganancia);
  const fuentes: AudioBufferSourceNode[] = [];
  let inicio = 0;
  let duracion = 0;
  let destruido = false;
  let volumen = dep.volumen;
  let mudo = false;
  const aplicar = () => ganancia.gain.setTargetAtTime(mudo ? 0 : volumen, ctx.currentTime, 0.04);

  const cargar = (url: string) =>
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((datos) => ctx.decodeAudioData(datos));

  const empezar = ([efectos, musica]: AudioBuffer[]) => {
    if (destruido || !efectos || !musica) return;
    duracion = efectos.duration;
    // arrancan desde donde va la animación, así el cambio de reloj no se nota
    const desde = posicionEnLoop(dep.desde(), 0, duracion);
    const cuando = ctx.currentTime;
    for (const [buffer, destino] of [
      [efectos, ganancia],
      [musica, puertaMusica],
    ] as const) {
      const f = ctx.createBufferSource();
      f.buffer = buffer;
      f.loop = true;
      f.connect(destino);
      f.start(cuando, desde);
      fuentes.push(f);
    }
    inicio = cuando - desde;
  };

  return {
    arrancar(silenciado) {
      mudo = silenciado;
      ganancia.gain.value = silenciado ? 0 : volumen;
      void ctx.resume();
      Promise.all([cargar(dep.efectos), cargar(dep.musica)])
        .then(empezar)
        .catch((e) => console.warn("el audio no cargó:", e));
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
    activarMusica() {
      puertaMusica.gain.setTargetAtTime(1, ctx.currentTime, ENTRADA_MUSICA);
    },
    suspender() {
      void ctx.suspend();
    },
    reanudar() {
      void ctx.resume();
    },
    sonando: () => ctx.state === "running",
    posicion() {
      if (fuentes.length === 0 || ctx.state !== "running") return null;
      // lo que se ve tiene que coincidir con lo que se oye: se descuenta la latencia de salida
      const latencia = ctx.outputLatency || ctx.baseLatency || 0;
      return posicionEnLoop(ctx.currentTime - latencia, inicio, duracion);
    },
    destruir() {
      destruido = true;
      for (const f of fuentes) f.stop();
      void ctx.close();
    },
  };
}
