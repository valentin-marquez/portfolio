// Ambiente generativo: viento de ruido rosa filtrado que sigue a las ráfagas, un dron grave casi
// imperceptible y una reverberación larga que los envuelve. Todo es suave y entra con un fundido
// largo; nada suena de golpe. El paneo sigue al frente de la ola: el sonido cruza con el pasto.
import { crearAzar } from "@/prado/azar";
import type { MotorSonido } from "./control";
import { generarRuidoRosa } from "./ruido-rosa";

const VOLUMEN = 0.45;
const ENTRADA_S = 4;
const HUMEDO = 0.4;

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Cómo suena el viento según la ráfaga: ganancia baja, filtro oscuro y paneo con la ola. */
export function sonidoDelViento(intensidad: number, frente: number) {
  const i = limitar(intensidad, 0, 1);
  return {
    ganancia: 0.015 + 0.09 * i,
    frecuencia: 220 + 380 * i,
    // sin ráfaga el viento queda al centro; con ella cruza de izquierda a derecha (+ 0 evita un -0)
    paneo: limitar((frente - 0.5) * 1.2, -0.6, 0.6) * i + 0,
  };
}

/** Respuesta al impulso procedural: ruido estéreo que se apaga en unos segundos, como un espacio abierto. */
function crearReverberacion(ctx: AudioContext): ConvolverNode {
  const duracion = 2.8;
  const n = Math.floor(ctx.sampleRate * duracion);
  const ir = ctx.createBuffer(2, n, ctx.sampleRate);
  const azar = crearAzar(21);
  for (let canal = 0; canal < 2; canal++) {
    const datos = new Float32Array(n);
    for (let k = 0; k < n; k++) datos[k] = (azar() * 2 - 1) * (1 - k / n) ** 2.5;
    ir.copyToChannel(datos, canal);
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = ir;
  return reverb;
}

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
  const reverb = crearReverberacion(ctx);
  const humedo = ctx.createGain();
  humedo.gain.value = HUMEDO;
  reverb.connect(humedo).connect(maestro);

  // viento: ruido rosa en bucle → pasa-banda que respira con un LFO → pasa-bajo → ganancia → paneo
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate);
  buffer.copyToChannel(generarRuidoRosa(buffer.length, crearAzar(7)), 0);
  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;
  ruido.loop = true;
  const inicial = sonidoDelViento(0, 0.5);
  const banda = ctx.createBiquadFilter();
  banda.type = "bandpass";
  banda.frequency.value = inicial.frecuencia;
  banda.Q.value = 0.45;
  const bajo = ctx.createBiquadFilter();
  bajo.type = "lowpass";
  bajo.frequency.value = 900;
  const gananciaViento = ctx.createGain();
  gananciaViento.gain.value = inicial.ganancia;
  const paneo = ctx.createStereoPanner();
  ruido.connect(banda).connect(bajo).connect(gananciaViento).connect(paneo);
  paneo.connect(maestro);
  paneo.connect(reverb);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const profundidadLfo = ctx.createGain();
  profundidadLfo.gain.value = 50;
  lfo.connect(profundidadLfo).connect(banda.frequency);

  // dron: tres senos graves, apenas un colchón que también pasa por la reverberación
  const dron = ctx.createGain();
  dron.gain.value = 0.008;
  dron.connect(maestro);
  dron.connect(reverb);
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
  // el navegador puede rechazar estas promesas (sin gesto, contexto cerrado); no son errores de la página
  const ignorar = () => {};

  return {
    arrancar(s) {
      silenciado = s;
      ruido.start();
      lfo.start();
      for (const o of osciladores) o.start();
      ctx.resume().catch(ignorar);
      // setTargetAtTime llega al ~95 % en tres constantes de tiempo
      maestro.gain.setTargetAtTime(objetivo(), ctx.currentTime, ENTRADA_S / 3);
    },
    fijarViento(intensidad, frente) {
      const t = ctx.currentTime;
      const s = sonidoDelViento(intensidad, frente);
      // respuestas lentas: el sonido respira con la ola, no la persigue
      gananciaViento.gain.setTargetAtTime(s.ganancia, t, 1.6);
      banda.frequency.setTargetAtTime(s.frecuencia, t, 1.6);
      paneo.pan.setTargetAtTime(s.paneo, t, 0.9);
    },
    soplo(p) {
      // un soplo: el mismo ruido rosa, filtrado más arriba, con subida rápida y cola larga
      const t = ctx.currentTime;
      const fuente = ctx.createBufferSource();
      fuente.buffer = buffer;
      const filtro = ctx.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.frequency.value = 900;
      filtro.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      const lado = ctx.createStereoPanner();
      lado.pan.value = p;
      fuente.connect(filtro).connect(g).connect(lado);
      lado.connect(maestro);
      lado.connect(reverb);
      fuente.start(t, Math.random() * 6);
      fuente.stop(t + 1.3);
    },
    fijarSilencio(s) {
      silenciado = s;
      maestro.gain.setTargetAtTime(objetivo(), ctx.currentTime, 0.3);
    },
    suspender() {
      ctx.suspend().catch(ignorar);
    },
    reanudar() {
      ctx.resume().catch(ignorar);
    },
    sonando() {
      return ctx.state === "running";
    },
    destruir() {
      ctx.close().catch(ignorar);
    },
  };
}
