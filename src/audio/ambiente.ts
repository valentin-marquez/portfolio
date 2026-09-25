// Ambiente generativo: viento de ruido rosa filtrado que sigue a las ráfagas, y un dron grave casi
// imperceptible. Todo entra con un fundido largo; nada suena de golpe.
import { crearAzar } from "@/prado/azar";
import type { MotorSonido } from "./control";
import { generarRuidoRosa } from "./ruido-rosa";

const VOLUMEN = 0.9;
const ENTRADA_S = 4;

export function crearMotorSonido(
  crearContexto: () => AudioContext = () => new AudioContext(),
): MotorSonido | null {
  let ctx: AudioContext;
  try {
    ctx = crearContexto();
  } catch {
    return null;
  }

  const maestro = ctx.createGain();
  maestro.gain.value = 0;
  maestro.connect(ctx.destination);

  // viento: ruido rosa en bucle → pasa-banda que respira con un LFO → pasa-bajo → ganancia
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate);
  buffer.copyToChannel(generarRuidoRosa(buffer.length, crearAzar(7)), 0);
  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;
  ruido.loop = true;
  const banda = ctx.createBiquadFilter();
  banda.type = "bandpass";
  banda.frequency.value = 350;
  banda.Q.value = 0.6;
  const bajo = ctx.createBiquadFilter();
  bajo.type = "lowpass";
  bajo.frequency.value = 1400;
  const gananciaViento = ctx.createGain();
  gananciaViento.gain.value = 0.05;
  ruido.connect(banda).connect(bajo).connect(gananciaViento).connect(maestro);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const profundidadLfo = ctx.createGain();
  profundidadLfo.gain.value = 80;
  lfo.connect(profundidadLfo).connect(banda.frequency);

  // dron: tres senos graves, apenas un colchón
  const dron = ctx.createGain();
  dron.gain.value = 0.012;
  dron.connect(maestro);
  const osciladores = [55, 82.5, 110].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = [1, 0.6, 0.25][i] as number;
    o.connect(g).connect(dron);
    return o;
  });

  let silenciado = false;
  const objetivo = () => (silenciado ? 0 : VOLUMEN);

  return {
    arrancar(s) {
      silenciado = s;
      ruido.start();
      lfo.start();
      for (const o of osciladores) o.start();
      void ctx.resume();
      // setTargetAtTime llega al ~95 % en tres constantes de tiempo
      maestro.gain.setTargetAtTime(objetivo(), ctx.currentTime, ENTRADA_S / 3);
    },
    fijarViento(i) {
      const t = ctx.currentTime;
      gananciaViento.gain.setTargetAtTime(0.04 + i * 0.22, t, 0.8);
      banda.frequency.setTargetAtTime(300 + i * 500, t, 0.8);
    },
    fijarSilencio(s) {
      silenciado = s;
      maestro.gain.setTargetAtTime(objetivo(), ctx.currentTime, 0.3);
    },
    suspender() {
      void ctx.suspend();
    },
    reanudar() {
      void ctx.resume();
    },
    destruir() {
      void ctx.close();
    },
  };
}
