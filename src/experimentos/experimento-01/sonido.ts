// Los sonidos del propio juego (Minecraft Wiki, pasados a mp3 para Safari), con la variación de tono
// que usa Minecraft. Lo que le pasa al gólem suena siempre a él: sus pasos, su daño, su crujido y su
// muerte; nada del jugador.
import { DISPARO, IMPACTO, MUERE, PISA, TOCA_PISO, tiempoReal } from "./tiempo";

export type Sonido = { archivos: string[]; vol: number; tono: number; varia: number; dura: number };
/** archivo (o variantes al azar), volumen, tono, variación de tono y duración máxima con fundido */
const S = (archivo: string | string[], vol = 1, tono = 1, varia = 0, dura = 0): Sonido => ({
  archivos: [archivo].flat(),
  vol,
  tono,
  varia,
  dura,
});
const PASOS = ["Iron_golem_step1", "Iron_golem_step2", "Iron_golem_step3", "Iron_golem_step4"];
/** entity.iron_golem.hurt: tono de 0,8 a 1,2 */
const DANIO = ["Iron_golem_hurt1", "Iron_golem_hurt2", "Iron_golem_hurt3", "Iron_golem_hurt4"];
/** los golpes del propio gólem: su paso, más grave y fuerte */
const golpeHierro = (vol = 1) => S(PASOS, vol, 0.72, 0.05);

/** [tiempo de pose, sonido]; encajes: cuándo encaja cada panel al rearmarse la tarjeta */
export function suena(encajes: number[]): [number, Sonido][] {
  return [
    [0, S("Click", 0.8)],
    // la cinta se descifra
    ...[0.08, 0.16, 0.42, 0.5].map((p): [number, Sonido] => [
      p,
      S("Stone_button_press", 0.22, 1.9, 0.05, 0.08),
    ]),
    [0.55, S("Beacon_activate", 0.75, 1.6, 0, 0.62)], // carga
    [1.15, S("Beacon_power1", 0.9, 1, 0, 1.2)], // ignición
    [1.17, S("Fizz", 0.22, 1.6, 0, 0.35)], // costuras
    [1.5, S("Iron_trapdoor_open1", 0.8, 1, 0.1)], // saltan los paneles
    [1.8, S("Piston_extend_JE3", 0.9)],
    [2.1, golpeHierro(1)], // las piernas contra el piso
    [2.1, S("Iron_trapdoor_close1", 0.6, 0.8)],
    [2.2, S("Piston_contract_JE3", 0.8)],
    [2.45, golpeHierro(0.9)], // se asienta
    // vuelos y aterrizajes
    ...[1.95, 2.3, 2.5, 2.7, 2.85, 3.0].map((p, k): [number, Sonido] => [
      p,
      S(`Sweep_attack${(k % 3) + 1}`, 0.5, 1, 0.15),
    ]),
    ...[2.4, 2.8, 3.15, 3.3, 3.5].map((p): [number, Sonido] => [
      p,
      S("Iron_golem_repair", 0.55, 1, 0.12),
    ]),
    ...[2.4, 2.8, 3.15, 3.3, 3.5].map((p, k): [number, Sonido] => [
      p,
      S(`Iron_trapdoor_close${(k % 2) + 1}`, 0.5, 1, 0.1),
    ]),
    // la cabeza: toma impulso y cae
    [3.6, S("Equip_iron1", 0.8)],
    [3.86, S("Anvil_land", 1)],
    [3.86, golpeHierro(0.8)],
    [3.95, S("Stone_button_press", 0.5, 1.3)], // nariz
    [4.1, S("Beacon_power2", 0.6, 1, 0, 1.2)], // ojos
    [4.35, S("Challenge_complete", 0.55, 1, 0, 2.6)], // «ta-da»
    ...PISA.map((p): [number, Sonido] => [p, S(PASOS, 0.9)]),
    // la amapola
    [10.4, S("Note_block_pling", 0.6, 1.19)],
    [10.52, S("Note_block_pling", 0.5, 1.5)],
    // el flechazo suena sobre todo a él: su daño y su crujido de hierro que se agrieta
    [DISPARO, S("Bow_shoot", 0.9, 1, 0.1)],
    [IMPACTO, S("Arrow_hit1", 0.45)],
    [IMPACTO, S(DANIO, 1, 1, 0.2)],
    [IMPACTO + 0.04, S(["Iron_golem_damage1", "Iron_golem_damage2"], 0.8, 0.9, 0.1)],
    [MUERE + 0.05, S("Iron_golem_death", 1, 1, 0.2)],
    [TOCA_PISO, golpeHierro(1)],
    // se rearma la tarjeta
    [13.0, S("Enchanting_Table_enchant1", 0.7)],
    [13.4, S("Toast", 0.55)],
    ...encajes.map((p, k): [number, Sonido] => [
      p,
      S(`Iron_trapdoor_close${(k % 2) + 1}`, 0.3, 1.2, 0.15),
    ]),
    [14.02, S("Pop", 0.8, 1, 0.2)], // la amapola llega al casillero
    // encaja: el mismo «pling» de la amapola, como eco
    [14.25, S("Note_block_pling", 0.45, 1.19)],
    [14.37, S("Note_block_pling", 0.4, 1.5)],
  ];
}

/** lo que suena entre desde (excluido) y hasta (incluido), en tiempo real */
export function eventosEntre(tabla: [number, Sonido][], desde: number, hasta: number): Sonido[] {
  return tabla
    .filter(([p]) => {
      const t = tiempoReal(p);
      return t > desde && t <= hasta;
    })
    .map(([, s]) => s);
}

const CLAVE = "experimento-01:silencio";

export function crearSonido(almacen: Storage | null, tabla: [number, Sonido][]) {
  let ac: AudioContext | null = null;
  let salida: GainNode | null = null;
  const buffers = new Map<string, AudioBuffer>();
  let apagado = (() => {
    try {
      return almacen?.getItem(CLAVE) === "1";
    } catch {
      return false;
    }
  })();
  const archivos = [...new Set(tabla.flatMap(([, s]) => s.archivos))];
  // se bajan al cargar la página; se decodifican con el primer gesto (política de autoplay)
  const crudos = new Map(
    archivos.map((n) => [
      n,
      fetch(`/experimento-01/sonidos/${n}.mp3`).then((r) => r.arrayBuffer()),
    ]),
  );

  async function preparar() {
    if (ac) return;
    ac = new AudioContext();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 3;
    salida = ac.createGain();
    salida.gain.value = 0.8;
    salida.connect(comp).connect(ac.destination);
    const contexto = ac;
    await Promise.all(
      archivos.map(async (n) => {
        const crudo = await crudos.get(n);
        if (crudo) buffers.set(n, await contexto.decodeAudioData(crudo));
      }),
    );
    await contexto.resume();
  }

  function tocar(s: Sonido) {
    if (!ac || !salida) return;
    const b = buffers.get(s.archivos[Math.floor(Math.random() * s.archivos.length)] ?? "");
    if (!b) return;
    const t0 = ac.currentTime + 0.01;
    const f = ac.createBufferSource();
    const g = ac.createGain();
    f.buffer = b;
    // como Minecraft: cada vez un poco distinto de tono
    f.playbackRate.value = s.tono * (1 + (Math.random() * 2 - 1) * s.varia);
    g.gain.value = s.vol;
    f.connect(g).connect(salida);
    f.start(t0);
    if (s.dura) {
      g.gain.setValueAtTime(s.vol, t0 + s.dura * 0.7);
      g.gain.linearRampToValueAtTime(0.0001, t0 + s.dura);
      f.stop(t0 + s.dura + 0.02);
    }
  }

  return {
    preparar,
    sonar(desde: number, hasta: number) {
      if (apagado) return;
      for (const s of eventosEntre(tabla, desde, hasta)) tocar(s);
    },
    silenciado: () => apagado,
    alternar() {
      apagado = !apagado;
      try {
        almacen?.setItem(CLAVE, apagado ? "1" : "0");
      } catch {
        // sin almacenamiento, la preferencia dura solo esta visita
      }
      return apagado;
    },
  };
}
