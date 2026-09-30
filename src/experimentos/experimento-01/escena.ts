// La escena completa y su coreografía: pose(t) deja todo en su lugar para el instante t (tiempo real,
// con las pausas de impacto). No crea renderer, así que se prueba en Node.
import * as THREE from "three";
import {
  CARA,
  crearGolem,
  cruzAmapola,
  FLECHA_DESDE,
  FLECHA_DIR,
  FLECHA_PUNTA,
  PANELES,
  TARJETA,
  type Texturas,
  uvs,
} from "./golem";
import {
  azar,
  caeMuerto,
  caminata,
  DISPARO,
  ENCAJA,
  entra,
  GOLPES,
  HUMO,
  IMPACTO,
  POOF,
  pasa,
  paso,
  ruido,
  sale,
  tiempoPose,
  tiempoReal,
  tramo,
  trauma,
  triangulo,
} from "./tiempo";

export type Fotos = { formulario: THREE.Texture; gracias: THREE.Texture };
export type Panel = {
  g: THREE.Group;
  linea: THREE.LineSegments;
  destino: THREE.Object3D;
  centro: THREE.Vector3;
  tam: THREE.Vector2;
  vuelo: [number, number];
  vuelta: [number, number];
  sale: THREE.Vector3;
  separa: THREE.Vector3;
  dispersa: THREE.Vector3;
  giro: THREE.Quaternion;
  giroVuelta: THREE.Quaternion;
};
export type Escena = {
  escena: THREE.Scene;
  camara: THREE.PerspectiveCamera;
  tarjeta: THREE.Group;
  paneles: Panel[];
  /** deja todo en su lugar para el instante t (tiempo real) */
  pose(t: number): void;
  /** opacidad de la capa de destello en el instante t, 0 a 0,6 */
  destello(t: number): number;
  /** el encuadre del primer y el último cuadro: distancia de la cámara y altura del centro de la tarjeta */
  encuadrar(distancia: number, alto: number): void;
};

const { ALTO, ANCHO, ELEVA, ZT } = TARJETA;
const A = ANCHO / 2;
const LIM = 13; // período de caminata de IronGolemModel
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** vuelo de cada grupo de paneles (tiempo de pose): despega seco, frena largo y aterriza con golpe */
const VUELO = {
  piernas: [1.95, 2.4],
  medio: [2.3, 2.8],
  brazos: [2.5, 3.15],
  torso: [2.7, 3.3],
  cabeza: [3.0, 3.5],
} as const;
const TONOS = {
  polvo: ["#e8e1d0", "#ddd4bf", "#cfc5ae"],
  hierro: ["#e6ded3", "#c9bfb2", "#a89d8f", "#dcd3c6", "#5d8a2c"],
  humo: ["#ffffff", "#f4f2ee", "#e9e6e0", "#dcd8d0"],
};
const MAX = 500;

export function crearEscena(tex: Texturas & Fotos): Escena {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#f6f3ea"); // el fondo del portafolio
  escena.fog = new THREE.Fog("#f6f3ea", 150, 420); // el piso se disuelve en el fondo, como el prado
  const camara = new THREE.PerspectiveCamera(30, 1, 1, 2000);
  escena.add(new THREE.HemisphereLight("#fffaf0", "#b9ae94", 2.0));
  const sol = new THREE.DirectionalLight("#ffffff", 2.4);
  sol.position.set(40, 90, 70);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -70, right: 50, top: 80, bottom: -20, far: 300 });
  escena.add(sol);
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshLambertMaterial({ color: "#efebe1", transparent: true }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  escena.add(piso);
  const rejilla = new THREE.GridHelper(512, 32, "#ddd6c4", "#e5dfcf"); // una celda = un bloque (16 px)
  const matRejilla = rejilla.material as THREE.Material;
  matRejilla.transparent = true;
  rejilla.position.y = 0.05;
  escena.add(rejilla);

  const golem = crearGolem(tex);
  const { raiz, partes, ojos, matOjo, matHierro, matAmapola, amapola, flecha } = golem;
  escena.add(raiz);
  const matFoto = new THREE.MeshBasicMaterial({ map: tex.formulario });

  // ============ la tarjeta y sus paneles ============
  const tarjeta = new THREE.Group();
  escena.add(tarjeta);
  const r = azar(11);
  const bordePlano = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1));
  const paneles: Panel[] = PANELES.map((d, i) => {
    const g = new THREE.Group();
    const frente = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matFoto);
    uvs(
      frente.geometry,
      [[(d.x0 + A) / ANCHO, (ALTO - d.y1) / ALTO, (d.x1 + A) / ANCHO, (ALTO - d.y0) / ALTO]],
      1,
      1,
    );
    const p = partes[d.parte];
    const [u0, v0, u1, v1] = p.lista[CARA[d.cara]] ?? [0, 0, 0, 0];
    const [a0, b0, a1, b1] = d.sub ?? [0, 0, 1, 1];
    // la cara de atrás tiene el UV exacto de la cara del gólem donde aterriza
    const atras = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matHierro);
    uvs(
      atras.geometry,
      [[u0 + (u1 - u0) * a0, v0 + (v1 - v0) * b0, u0 + (u1 - u0) * a1, v0 + (v1 - v0) * b1]],
      128,
      128,
    );
    atras.rotation.y = Math.PI;
    const linea = new THREE.LineSegments(
      bordePlano,
      new THREE.LineBasicMaterial({ color: "#86d562", transparent: true }),
    );
    linea.position.z = 0.05;
    g.add(frente, atras, linea);
    frente.castShadow = atras.castShadow = true;
    escena.add(g);
    const destino = new THREE.Object3D();
    destino.position.set((a0 + a1) / 2 - 0.5, 0.5 - (b0 + b1) / 2, 0.004);
    destino.scale.set(a1 - a0, b1 - b0, 1);
    destino.rotation.y = Math.PI; // aterriza dado vuelta: queda a la vista la cara de hierro
    p.caras[CARA[d.cara]]?.add(destino);
    const [v0_, v1_] = VUELO[d.grupo];
    const retraso = (i % 4) * 0.035;
    const centro = V((d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, 0);
    const fuera = V(centro.x, centro.y - ALTO * 0.5, 0).normalize();
    // al rearmarse salen de la nube en orden aleatorio y vuelven a su lugar en la tarjeta
    const vuelta = 13.05 + r() * 0.55;
    return {
      g,
      linea,
      destino,
      centro,
      tam: new THREE.Vector2(d.x1 - d.x0, d.y1 - d.y0),
      vuelo: [v0_ + retraso, v1_ + retraso],
      vuelta: [vuelta, vuelta + 0.55 + r() * 0.2],
      sale: V(HUMO.x, HUMO.y, HUMO.z).add(V((r() - 0.5) * 22, r() * 10, (r() - 0.5) * 10)),
      separa: fuera
        .clone()
        .multiplyScalar(1.1)
        .setZ(0.6 + r() * 1.4),
      dispersa: V(Math.sign(centro.x || r() - 0.5) * (4 + r() * 7), 3 + r() * 6, 7 + r() * 8),
      giro: new THREE.Quaternion().setFromEuler(
        new THREE.Euler((r() - 0.5) * 2.2, (r() - 0.5) * 2.2, (r() - 0.5) * 1.4),
      ),
      giroVuelta: new THREE.Quaternion().setFromEuler(
        new THREE.Euler((r() - 0.5) * 5, Math.PI + (r() - 0.5) * 3, (r() - 0.5) * 3),
      ),
    };
  });
  // costuras: los bordes de todos los paneles más el contorno, que se encienden en la ignición
  const tramos = new Map<string, [number, number, number, number]>();
  for (const { x0, y0, x1, y1 } of PANELES)
    for (const s of [
      [x0, y0, x1, y0],
      [x1, y0, x1, y1],
      [x0, y1, x1, y1],
      [x0, y0, x0, y1],
    ] as [number, number, number, number][])
      tramos.set(s.map((v) => v.toFixed(2)).join(), s);
  const matCostura = new THREE.MeshBasicMaterial({ color: "#86d562", transparent: true });
  const costuras = [...tramos.values()].map(([x0, y0, x1, y1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matCostura);
    const borde = (Math.abs(x0) === A && x0 === x1) || ((y0 === 0 || y0 === ALTO) && y0 === y1);
    const d =
      new THREE.Vector2((x0 + x1) / 2, (y0 + y1) / 2).distanceTo(new THREE.Vector2(0, ALTO * 0.5)) /
      30;
    tarjeta.add(m);
    return {
      m,
      x0,
      y0,
      x1,
      y1,
      largo: Math.hypot(x1 - x0, y1 - y0),
      horizontal: y0 === y1,
      retraso: borde ? 1.15 : 1.17 + d * 0.2,
    };
  });

  // ============ partículas (puras en el tiempo: cada golpe es una fuente) ============
  const particulas = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: "#ffffff" }),
    MAX,
  );
  particulas.frustumCulled = false;
  particulas.castShadow = true;
  escena.add(particulas);
  const color = new THREE.Color();

  // la que se cae con el flechazo y después vuela al casillero de la tarjeta de gracias
  const amapolaSuelta = cruzAmapola(matAmapola, 8);
  escena.add(amapolaSuelta);
  // el casillero en la tarjeta de gracias (fracción desde arriba a la izquierda, medida en el DOM)
  const CASILLERO = V(-A + 0.1167 * ANCHO, ALTO * (1 - 0.6122), 0.3);
  const acostada = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0.6, 0));

  function poseGolem(p: number) {
    // piernas: salen como pistones hasta el piso (acelerando) y el cuerpo baja de golpe
    const piernaSale = tramo(1.8, 2.1, p, entra);
    const baja = tramo(2.2, 2.45, p, entra) - 0.05 * Math.sin(Math.PI * paso(2.45, 2.7, p));
    const alto = ELEVA * (1 - baja);
    const empuje = 2.5 * tramo(IMPACTO, IMPACTO + 0.18, p, sale); // la flecha lo echa hacia atrás
    raiz.position.set(0, alto, caminata(p) - empuje);
    raiz.rotation.set(
      -0.12 * Math.sin(Math.PI * paso(IMPACTO, IMPACTO + 0.35, p)),
      0,
      (Math.PI / 2) * caeMuerto(p),
    );
    raiz.visible = p < POOF;
    const largo = THREE.MathUtils.lerp(0.25, (13 + alto) / 13, piernaSale); // el pie llega justo al piso
    const giro = caminata(p) * 1.3; // limbSwing
    const amp = 0.55 * tramo(7.9, 8.3, p) * (1 - tramo(9.8, 10.2, p)); // limbSwingAmount de un gólem al paso
    for (const [n, s] of [
      ["piernaD", -1],
      ["piernaI", 1],
    ] as const) {
      const q = partes[n];
      q.grupo.scale.set(1, largo, 1);
      q.grupo.visible = p > 1.78;
      q.caja.scale.z = 5 * THREE.MathUtils.lerp(0.1, 1, tramo(1.78, 2.0, p, sale));
      q.grupo.rotation.x = s * 1.5 * triangulo(giro, LIM) * amp;
    }
    for (const [n, a] of [
      ["cintura", 2.25],
      ["torso", 2.4],
    ] as const) {
      const q = partes[n];
      q.grupo.visible = p > a;
      q.caja.scale.z = q.def.t[2] * THREE.MathUtils.lerp(0.08, 1, tramo(a, a + 0.3, p, sale));
    }
    // brazos: se abren de golpe, vuelven, «ta-da» y reposo; al caminar se mecen; al final ofrecen la amapola
    const abre = tramo(2.5, 2.75, p, pasa) * (1 - tramo(3.05, 3.35, p, sale));
    const tada = tramo(4.35, 4.6, p, pasa) * (1 - tramo(5.2, 5.8, p));
    const ofrece = tramo(10.3, 10.75, p, pasa) * (1 - tramo(IMPACTO, IMPACTO + 0.25, p, sale));
    const oferta = p > 10.3 ? triangulo((p - 10.3) * 20, 70) : 0; // offerFlowerTick
    for (const [n, s] of [
      ["brazoD", -1],
      ["brazoI", 1],
    ] as const) {
      const q = partes[n];
      q.grupo.visible = p > 2.45;
      q.caja.scale.z = 6 * THREE.MathUtils.lerp(0.1, 1, tramo(2.45, 2.7, p, sale));
      q.grupo.rotation.z =
        s * (1.2 * abre + 2.0 * tada) + s * 0.35 * tramo(IMPACTO, IMPACTO + 0.2, p, pasa);
      const mece = (-0.2 - s * 1.5 * triangulo(giro, LIM)) * amp;
      // −0,8: la pose del juego al ofrecer la flor
      q.grupo.rotation.x =
        -0.35 * tada + mece + (n === "brazoD" ? (-0.8 + 0.025 * oferta) * ofrece : 0);
    }
    amapola.scale.setScalar(p < IMPACTO ? Math.max(0.001, tramo(10.4, 10.75, p, pasa)) : 0.001);
    // la cabeza es la «calabaza» que completa el gólem, como en el juego: baja girando mientras se le
    // pegan sus paneles, toma impulso y cae de golpe sobre los hombros
    const c = partes.cabeza;
    c.grupo.visible = p > 2.85;
    const llega = tramo(2.85, 3.15, p, sale);
    const impulso = tramo(3.6, 3.72, p, sale);
    const cae = tramo(3.72, 3.86, p, entra);
    c.grupo.position.y = 31 + (1 - cae) * (THREE.MathUtils.lerp(30, 9, llega) + 2.5 * impulso);
    c.grupo.rotation.y =
      (1 - tramo(3.0, 3.6, p, sale)) * -Math.PI * 1.5 -
      0.55 * tramo(6.4, 6.9, p) * (1 - tramo(7.1, 7.5, p)) +
      0.55 * tramo(7.1, 7.5, p) * (1 - tramo(7.6, 8.0, p));
    c.grupo.rotation.x =
      0.18 * impulso * (1 - cae) + 0.3 * Math.sin(Math.PI * paso(IMPACTO, IMPACTO + 0.4, p));
    partes.nariz.grupo.scale.setScalar(Math.max(0.001, tramo(3.95, 4.1, p, pasa)));
    const brillo = tramo(4.1, 4.16, p) * (1 - tramo(4.3, 4.9, p));
    for (const o of ojos) o.scale.setScalar(2 + 4 * brillo);
    matOjo.opacity = brillo;
    // herido y muerto: el rojo de Minecraft sobre todo el cuerpo; al rearmarse, hierro limpio
    const rojo = p >= IMPACTO && p < POOF ? 0.5 : 0;
    matHierro.color.setRGB(1, 1 - rojo, 1 - rojo);
    // la flecha: vuela, se clava y vibra
    flecha.visible = p > DISPARO && p < POOF;
    const vibra =
      p > IMPACTO ? 0.12 * Math.sin((p - IMPACTO) * 70) * Math.exp(-(p - IMPACTO) * 9) : 0;
    flecha.quaternion
      .setFromUnitVectors(V(1, 0, 0), FLECHA_DIR)
      .multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), vibra));
    flecha.position
      .copy(FLECHA_DESDE)
      .lerp(FLECHA_PUNTA, paso(DISPARO, IMPACTO, p))
      .addScaledVector(FLECHA_DIR, -7.2 * 0.9);
  }

  // dónde está la amapola en la mano justo al recibir el flechazo (se calcula una vez)
  poseGolem(IMPACTO - 0.001);
  raiz.updateMatrixWorld(true);
  const enMano = { p: V(0, 0, 0), q: new THREE.Quaternion() };
  amapola.matrixWorld.decompose(enMano.p, enMano.q, V(0, 0, 0));

  function poseTarjeta(p: number, t: number) {
    matFoto.map = p > POOF ? tex.gracias : tex.formulario;
    const encajando = 1 + 0.025 * Math.sin(Math.PI * paso(14.2, 14.45, p));
    const tiembla = tramo(0.55, 1.15, p, (k) => k * k) * (1 - tramo(1.15, 1.35, p));
    const k = tramo(0.55, 1.9, p) * (1 - tramo(12.9, 13.7, p)); // al rearmarse vuelve de frente, donde estaba el formulario
    tarjeta.position.set(
      0.35 * tiembla * ruido(t, 1.3),
      ELEVA + 0.35 * tiembla * ruido(t, 7.7),
      ZT,
    );
    tarjeta.rotation.set(
      0.07 * k + 0.02 * tiembla * ruido(t, 3.1),
      -0.2 * k + 0.025 * tiembla * ruido(t, 5.9),
      0.012 * tiembla * ruido(t, 2.2),
    );
    tarjeta.scale.setScalar(encajando);
    tarjeta.updateMatrixWorld(true);
    const encaja = p > 14.05 && p < 14.7; // al rearmarse las costuras brillan un instante y se apagan
    for (const s of costuras) {
      const L = Math.max(0.001, s.largo * tramo(s.retraso, s.retraso + 0.12, p, sale));
      s.m.position.set((s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2, 0.06);
      s.m.scale.set(s.horizontal ? L : 0.26, s.horizontal ? 0.26 : L, 1);
      s.m.visible = (p > s.retraso && p < 1.9) || encaja;
    }
    matCostura.opacity = encaja ? 1 - tramo(14.3, 14.7, p) : 1 - tramo(1.6, 1.9, p);
  }

  function poseAmapola(p: number) {
    // se le cae de la mano, rebota en el piso y después vuela a su casillero en la tarjeta de gracias
    amapolaSuelta.visible = p > IMPACTO && p < 14.05;
    const cae = paso(IMPACTO, IMPACTO + 0.4, p);
    const suelo = V(enMano.p.x - 5, 0.4, enMano.p.z + 7);
    const pos = enMano.p.clone().lerp(suelo, cae);
    pos.y =
      THREE.MathUtils.lerp(enMano.p.y, 0.4, cae * cae) + 5 * Math.sin(Math.PI * cae) * (1 - cae);
    const q = enMano.q.clone().slerp(acostada, sale(cae));
    const vuela = tramo(13.45, 14.05, p, sale);
    if (vuela > 0) {
      const casillero = tarjeta.localToWorld(CASILLERO.clone());
      const arco = suelo
        .clone()
        .lerp(casillero, 0.5)
        .add(V(0, 14, 6));
      pos
        .copy(suelo)
        .multiplyScalar((1 - vuela) ** 2)
        .addScaledVector(arco, 2 * vuela * (1 - vuela))
        .addScaledVector(casillero, vuela * vuela);
      q.slerp(tarjeta.quaternion, vuela);
    }
    amapolaSuelta.position.copy(pos);
    amapolaSuelta.quaternion.copy(q);
    amapolaSuelta.scale.setScalar(
      THREE.MathUtils.lerp(1, 0.32, vuela) * (1 + 0.4 * Math.sin(Math.PI * paso(13.45, 13.6, p))),
    );
  }

  const _p = V(0, 0, 0);
  const _q = new THREE.Quaternion();
  const _s = V(0, 0, 0);
  const _p2 = V(0, 0, 0);
  const _q2 = new THREE.Quaternion();
  const _s2 = V(0, 0, 0);
  const _m = new THREE.Matrix4();
  function posePaneles(p: number) {
    raiz.updateMatrixWorld(true);
    for (const x of paneles) {
      const sep = p < POOF ? tramo(1.5, 1.72, p, pasa) : 0;
      _m.makeTranslation(
        x.centro.x + x.separa.x * sep,
        x.centro.y + x.separa.y * sep,
        x.separa.z * sep,
      );
      _m.premultiply(tarjeta.matrixWorld);
      _m.decompose(_p, _q, _s);
      _s.set(x.tam.x * tarjeta.scale.x, x.tam.y * tarjeta.scale.y, 1);
      const borde = x.linea.material as THREE.LineBasicMaterial;
      if (p > POOF) {
        // se rearma: cada panel sale de la nube dando tumbos y aterriza de frente, ya con el «gracias»
        const [a, b] = x.vuelta;
        const f = tramo(a, b, p, sale);
        const control = x.sale
          .clone()
          .lerp(_p, 0.5)
          .add(V(0, 12, 8));
        x.g.position
          .copy(x.sale)
          .multiplyScalar((1 - f) ** 2)
          .addScaledVector(control, 2 * f * (1 - f))
          .addScaledVector(_p, f * f);
        x.g.quaternion.copy(x.giroVuelta).slerp(_q, f);
        const nace = tramo(a - 0.05, a + 0.12, p, sale);
        x.g.scale.set(_s.x * nace, _s.y * nace, 1);
        borde.opacity = (1 - tramo(14.3, 14.7, p)) * (p > a ? 1 : 0);
        x.g.visible = p > a - 0.05;
        continue;
      }
      x.destino.updateWorldMatrix(true, false);
      x.destino.matrixWorld.decompose(_p2, _q2, _s2);
      _p2.add(V(0, 0, -0.03).applyQuaternion(_q2));
      // anticipación: retrocede un poco antes de despegar; después, arranque seco y frenada larga
      const [a, b] = x.vuelo;
      const atras = Math.sin(Math.PI * paso(a - 0.1, a, p)) * 0.8;
      const f = tramo(a, b, p, sale);
      const control = _p.clone().lerp(_p2, 0.5).add(x.dispersa);
      x.g.position
        .copy(_p)
        .multiplyScalar((1 - f) ** 2)
        .addScaledVector(control, 2 * f * (1 - f))
        .addScaledVector(_p2, f * f);
      x.g.position.z -= atras;
      const g2 = x.giro.clone().premultiply(_q);
      x.g.quaternion.copy(
        f < 0.45 ? _q.clone().slerp(g2, f / 0.45) : g2.slerp(_q2, (f - 0.45) / 0.55),
      );
      x.g.scale.set(
        THREE.MathUtils.lerp(_s.x, Math.abs(_s2.x), f),
        THREE.MathUtils.lerp(_s.y, Math.abs(_s2.y), f),
        1,
      );
      const altura = x.g.position.y / 45;
      const apaga = tramo(4.6 + (1 - altura) * 0.6, 4.85 + (1 - altura) * 0.6, p);
      borde.opacity = tramo(1.5, 1.6, p) * (1 - apaga);
      x.g.visible = p < 5.5;
    }
  }

  const _mi = new THREE.Matrix4();
  const _qi = new THREE.Quaternion();
  const _e = new THREE.Euler();
  const _pi = V(0, 0, 0);
  const _si = V(0, 0, 0);
  function poseParticulas(t: number) {
    let n = 0;
    for (const [j, g] of GOLPES.entries()) {
      for (const { tipo, x, y, z, cuantas, fuerza } of g.fuentes) {
        const edad = t - tiempoReal(g.p);
        const vida = tipo === "hierro" ? 1.4 : tipo === "humo" ? 1.3 : 0.9;
        if (edad < 0 || edad > vida) continue;
        const r2 = azar(97 + j * 13 + Math.round(x * 7));
        for (let k = 0; k < cuantas && n < MAX; k++) {
          const ang = r2() * Math.PI * 2;
          if (tipo === "humo") {
            // el «poof»: bocanadas blancas repartidas a lo largo del cuerpo que suben y se achican
            const lx = x + (r2() - 0.5) * 40;
            const lz = z + (r2() - 0.5) * 10;
            const ly = y + r2() * 8;
            const tam = (1.4 + r2() * 2.2) * Math.sin(Math.PI * Math.min(1, edad / vida)) ** 0.6;
            _pi.set(
              lx + Math.cos(ang) * edad * 5,
              ly + edad * (6 + r2() * 6),
              lz + Math.sin(ang) * edad * 5,
            );
            _mi.compose(_pi, _qi.setFromEuler(_e.set(r2(), r2(), r2())), _si.set(tam, tam, tam));
          } else {
            const vel = (6 + r2() * 12) * fuerza;
            const sube = (tipo === "hierro" ? 10 + r2() * 14 : 2 + r2() * 4) * fuerza;
            const lejos = (vel * (1 - Math.exp(-edad * 3.5))) / 3.5;
            const alto = y + sube * edad - (tipo === "hierro" ? 30 : 4) * edad * edad;
            const tam =
              (tipo === "hierro" ? 1 + r2() * 1.2 : 0.8 + r2() * 1.6) * (1 - (edad / vida) ** 2);
            _pi.set(x + Math.cos(ang) * lejos, Math.max(0.3, alto), z + Math.sin(ang) * lejos);
            _mi.compose(
              _pi,
              _qi.setFromEuler(_e.set(r2() * 6 + edad * 8, r2() * 6, 0)),
              _si.set(tam, tam, tam),
            );
          }
          particulas.setMatrixAt(n, _mi);
          const tonos = TONOS[tipo];
          particulas.setColorAt(n, color.set(tonos[Math.floor(r2() * tonos.length)] ?? "#ffffff"));
          n++;
        }
      }
    }
    particulas.count = n;
    particulas.instanceMatrix.needsUpdate = true;
    if (particulas.instanceColor) particulas.instanceColor.needsUpdate = true;
  }

  // cámara: camino suave + temblor por trauma (Eiserloh) + golpe de zoom en la ignición
  type Plano = [number, [number, number, number], [number, number, number]];
  let inicio: [[number, number, number], [number, number, number]] = [
    [0, ELEVA + 21.5, ZT + 104],
    [0, ELEVA + 21.5, ZT],
  ];
  const planos = (): Plano[] => [
    [0, ...inicio],
    [1.15, [0, inicio[0][1], inicio[0][2] - 4], inicio[1]],
    [2.0, [-16, ELEVA + 20, ZT + 110], [0, ELEVA + 17, ZT]],
    [2.9, [-4, 34, 128], [0, 27, 2]],
    [3.9, [30, 31, 120], [0, 23, 2]],
    [6.0, [22, 25, 112], [0, 19, 2]],
    [10.2, [16, 24, 128], [0, 17, 8]],
    [11.6, [12, 24, 122], [0, 19, 10]],
    [12.5, [2, 28, 132], [-12, 14, 8]],
    [13.3, [-4, 30, 132], [-8, 18, 10]],
    [ENCAJA, ...inicio],
    [15.0, ...inicio],
  ];
  const mira = V(0, 0, 0);
  function poseCamara(p: number, t: number) {
    const lista = planos();
    let i = 0;
    while (i < lista.length - 2 && p > (lista[i + 1]?.[0] ?? 0)) i++;
    const [t0, p0, m0] = lista[i] as Plano;
    const [t1, p1, m1] = lista[i + 1] as Plano;
    const k = tramo(t0, t1, p);
    camara.position.set(
      ...(p0.map((v, j) => THREE.MathUtils.lerp(v, p1[j] ?? v, k)) as [number, number, number]),
    );
    mira.set(
      ...(m0.map((v, j) => THREE.MathUtils.lerp(v, m1[j] ?? v, k)) as [number, number, number]),
    );
    camara.lookAt(mira);
    const sacude = trauma(t) ** 2;
    camara.translateX(1.6 * sacude * ruido(t, 1.7));
    camara.translateY(2.0 * sacude * ruido(t, 4.2));
    camara.rotateZ(0.022 * sacude * ruido(t, 9.1));
    const ign = tiempoReal(1.15);
    const golpeZoom = paso(ign, ign + 0.06, t) * Math.exp(-Math.max(0, t - ign - 0.06) * 5);
    const fov = 30 - 1.5 * tramo(0.55, 1.15, p) * (1 - tramo(1.3, 2.0, p)) - 5 * golpeZoom;
    if (fov !== camara.fov) {
      camara.fov = fov;
      camara.updateProjectionMatrix();
    }
  }

  function destello(t: number) {
    const d = (p: number, a: number, dur: number) => {
      const e = t - tiempoReal(p);
      return e >= 0 ? a * Math.exp(-e / dur) : 0;
    };
    return Math.min(
      0.6,
      d(1.15, 0.35, 0.07) +
        d(3.86, 0.45, 0.06) +
        d(2.1, 0.12, 0.05) +
        d(IMPACTO, 0.25, 0.05) +
        d(POOF, 0.3, 0.08),
    );
  }

  function pose(t: number) {
    const p = tiempoPose(t);
    poseTarjeta(p, t);
    poseGolem(p);
    posePaneles(p);
    poseAmapola(p);
    poseParticulas(t);
    const suelo = tramo(1.6, 2.4, p) * (1 - tramo(13.6, 14.4, p));
    (piso.material as THREE.Material).opacity = suelo;
    matRejilla.opacity = suelo;
    poseCamara(p, t);
  }

  function encuadrar(distancia: number, alto: number) {
    inicio = [
      [0, alto, ZT + distancia],
      [0, alto, ZT],
    ];
  }

  return { escena, camara, tarjeta, paneles, pose, destello, encuadrar };
}
