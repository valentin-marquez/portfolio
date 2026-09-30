// El gólem de hierro de Minecraft: medidas, pivotes y mapa UV de IronGolemModel, la amapola como la
// dibuja IronGolemFlowerLayer y la flecha de ArrowRenderer. Coordenadas: y arriba, el gólem mira a
// +z, piso en y = 0 (y = 24 − y_modelo, z = −z_modelo). Solo construye mallas: no necesita renderer.
import * as THREE from "three";

export type Rect = [number, number, number, number];
export type NombreParte =
  | "piernaD"
  | "piernaI"
  | "torso"
  | "cintura"
  | "brazoD"
  | "brazoI"
  | "cabeza"
  | "nariz";
export type NombreCara = "izq" | "der" | "arriba" | "abajo" | "frente" | "atras";
type Tres = [number, number, number];
export type DefParte = {
  pivote: Tres;
  min: Tres;
  t: Tres;
  uv: [number, number];
  tuv?: Tres;
  espejo?: boolean;
  padre?: NombreParte;
};
export type Parte = {
  def: DefParte;
  grupo: THREE.Group;
  caja: THREE.Mesh;
  caras: THREE.Object3D[];
  lista: Rect[];
};
export type Texturas = { hierro: THREE.Texture; amapola: THREE.Texture; flecha: THREE.Texture };
export type Golem = {
  raiz: THREE.Group;
  partes: Record<NombreParte, Parte>;
  ojos: THREE.Sprite[];
  matOjo: THREE.SpriteMaterial;
  matHierro: THREE.MeshLambertMaterial;
  matAmapola: THREE.MeshBasicMaterial;
  amapola: THREE.Group;
  flecha: THREE.Group;
};

const T = 128; // la textura del gólem mide 128 × 128

/** rectángulos del mapa UV al estilo Minecraft, en el orden de caras de BoxGeometry: +x −x +y −y +z −z */
export function rects(
  u: number,
  v: number,
  w: number,
  h: number,
  d: number,
  espejo = false,
): Rect[] {
  const der: Rect = [u, v + d, u + d, v + d + h]; // lado derecho del gólem (−x)
  const frente: Rect = [u + d, v + d, u + d + w, v + d + h];
  const izq: Rect = [u + d + w, v + d, u + 2 * d + w, v + d + h]; // lado izquierdo (+x)
  const atras: Rect = [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h];
  const arriba: Rect = [u + d, v, u + d + w, v + d];
  const abajo: Rect = [u + d + w, v, u + d + 2 * w, v + d];
  const orden: Rect[] = [espejo ? der : izq, espejo ? izq : der, arriba, abajo, frente, atras];
  return espejo ? orden.map(([a, b, c, e]) => [c, b, a, e]) : orden;
}

/** pone cada rectángulo (en pixeles de una textura ancho × alto) en las 4 esquinas de cada cara */
export function uvs(geo: THREE.BufferGeometry, lista: Rect[], ancho: number, alto: number) {
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
  lista.forEach(([u0, v0, u1, v1], f) => {
    uv.setXY(f * 4, u0 / ancho, 1 - v0 / alto);
    uv.setXY(f * 4 + 1, u1 / ancho, 1 - v0 / alto);
    uv.setXY(f * 4 + 2, u0 / ancho, 1 - v1 / alto);
    uv.setXY(f * 4 + 3, u1 / ancho, 1 - v1 / alto);
  });
  uv.needsUpdate = true;
}

/** orientación de cada cara de un cubo unitario (coincide con cómo BoxGeometry arma sus UV) */
const CARAS: [Tres, Tres][] = [
  [
    [0.5, 0, 0],
    [0, Math.PI / 2, 0],
  ],
  [
    [-0.5, 0, 0],
    [0, -Math.PI / 2, 0],
  ],
  [
    [0, 0.5, 0],
    [-Math.PI / 2, 0, 0],
  ],
  [
    [0, -0.5, 0],
    [Math.PI / 2, 0, 0],
  ],
  [
    [0, 0, 0.5],
    [0, 0, 0],
  ],
  [
    [0, 0, -0.5],
    [0, Math.PI, 0],
  ],
];
export const CARA: Record<NombreCara, number> = {
  izq: 0,
  der: 1,
  arriba: 2,
  abajo: 3,
  frente: 4,
  atras: 5,
};

/** pivote (mundo), mínimo de la caja relativo al pivote, tamaño, uv; la cintura va inflada 0,5 */
export const MODELO: Record<NombreParte, DefParte> = {
  piernaD: { pivote: [-4, 13, 0], min: [-3.5, -13, -2], t: [6, 16, 5], uv: [37, 0] },
  piernaI: { pivote: [5, 13, 0], min: [-3.5, -13, -2], t: [6, 16, 5], uv: [60, 0], espejo: true },
  torso: { pivote: [0, 31, 0], min: [-9, -10, -5], t: [18, 12, 11], uv: [0, 40] },
  cintura: {
    pivote: [0, 31, 0],
    min: [-5, -15.5, -3.5],
    t: [10, 6, 7],
    uv: [0, 70],
    tuv: [9, 5, 6],
  },
  brazoD: { pivote: [-11, 31, 0], min: [-2, -27.5, -3], t: [4, 30, 6], uv: [60, 21] },
  brazoI: { pivote: [11, 31, 0], min: [-2, -27.5, -3], t: [4, 30, 6], uv: [60, 58] },
  cabeza: { pivote: [0, 31, 2], min: [-4, 2, -2.5], t: [8, 10, 8], uv: [0, 0] },
  nariz: { padre: "cabeza", pivote: [0, 0, 0], min: [-1, 1, 5.5], t: [2, 4, 2], uv: [24, 0] },
};

/** la tarjeta en pixeles de Minecraft: el formulario (480 × 686) casi tiene las proporciones del gólem */
export const TARJETA = { ALTO: 43, ANCHO: 43 * (480 / 686), ELEVA: 6, ZT: 11 };
const A = TARJETA.ANCHO / 2;

export type DefPanel = {
  parte: NombreParte;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cara: NombreCara;
  sub: Rect | null;
  grupo: "piernas" | "medio" | "brazos" | "torso" | "cabeza";
};
const panel = (
  parte: NombreParte,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cara: NombreCara,
  sub: Rect | null,
  grupo: DefPanel["grupo"],
): DefPanel => ({
  parte,
  x0,
  y0,
  x1,
  y1,
  cara,
  sub,
  grupo,
});
/** qué trozo del formulario (x centrado, y desde abajo) va a qué cara del gólem: cubren toda la tarjeta */
export const PANELES: DefPanel[] = [
  panel("cabeza", -4, 33, 4, 43, "frente", null, "cabeza"),
  panel("cabeza", -A, 33, -4, 43, "der", null, "cabeza"),
  panel("cabeza", 4, 33, A, 43, "izq", null, "cabeza"),
  panel("torso", -9, 21, 9, 33, "frente", null, "torso"),
  panel("brazoD", -13, 3.5, -9, 33, "frente", null, "brazos"),
  panel("brazoI", 9, 3.5, 13, 33, "frente", null, "brazos"),
  panel("brazoD", -A, 3.5, -13, 33, "der", null, "brazos"),
  panel("brazoI", 13, 3.5, A, 33, "izq", null, "brazos"),
  panel("brazoD", -A, 0, -9, 3.5, "abajo", null, "brazos"),
  panel("brazoI", 9, 0, A, 3.5, "abajo", null, "brazos"),
  panel("cintura", -4.5, 16, 4.5, 21, "frente", null, "medio"),
  panel("torso", -9, 16, -4.5, 21, "abajo", [0, 0, 0.5, 1], "medio"),
  panel("torso", 4.5, 16, 9, 21, "abajo", [0.5, 0, 1, 1], "medio"),
  panel("piernaD", -7.5, 0, -1.5, 16, "frente", null, "piernas"),
  panel("piernaI", 1.5, 0, 7.5, 16, "frente", null, "piernas"),
  panel("piernaD", -9, 0, -7.5, 16, "der", null, "piernas"),
  panel("piernaI", 7.5, 0, 9, 16, "izq", null, "piernas"),
  panel("piernaD", -1.5, 0, 0, 16, "izq", null, "piernas"),
  panel("piernaI", 0, 0, 1.5, 16, "der", null, "piernas"),
];

/** la amapola: dos planos cruzados, como las plantas en cruz de Minecraft */
export function cruzAmapola(mat: THREE.Material, tam: number) {
  const g = new THREE.Group();
  for (const giro of [Math.PI / 4, -Math.PI / 4]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), mat);
    p.rotation.y = giro;
    g.add(p);
  }
  return g;
}

/** la flecha sale de fuera de cuadro, a la derecha y adelante, y se clava en el pecho (coordenadas del torso) */
export const FLECHA_DESDE = new THREE.Vector3(95, 22, 80);
export const FLECHA_PUNTA = new THREE.Vector3(4.5, -4.5, 3.8);
export const FLECHA_DIR = FLECHA_PUNTA.clone().sub(FLECHA_DESDE).normalize();

function halo(): THREE.Texture | null {
  if (typeof document === "undefined") return null; // en las pruebas (Node) no hay canvas
  const c = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
  const x = c.getContext("2d");
  if (!x) return null;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,90,60,1)");
  g.addColorStop(0.35, "rgba(255,40,20,0.55)");
  g.addColorStop(1, "rgba(255,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function crearGolem(tex: Texturas): Golem {
  const matHierro = new THREE.MeshLambertMaterial({ map: tex.hierro, alphaTest: 0.5 });
  const raiz = new THREE.Group();
  raiz.name = "golem";
  const partes = {} as Record<NombreParte, Parte>;
  for (const [n, def] of Object.entries(MODELO) as [NombreParte, DefParte][]) {
    const grupo = new THREE.Group();
    grupo.name = n;
    grupo.position.set(...def.pivote);
    (def.padre ? partes[def.padre].grupo : raiz).add(grupo);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const [w, h, d] = def.tuv ?? def.t;
    const lista = rects(def.uv[0], def.uv[1], w, h, d, def.espejo);
    uvs(geo, lista, T, T);
    const caja = new THREE.Mesh(geo, matHierro);
    caja.castShadow = true;
    caja.position.set(
      def.min[0] + def.t[0] / 2,
      def.min[1] + def.t[1] / 2,
      def.min[2] + def.t[2] / 2,
    );
    caja.scale.set(...def.t);
    grupo.add(caja);
    const caras = CARAS.map(([p, r]) => {
      const o = new THREE.Object3D();
      o.position.set(...p);
      o.rotation.set(...r);
      caja.add(o);
      return o;
    });
    partes[n] = { def, grupo, caja, caras, lista };
  }
  // ojos: un destello rojo cuando el gólem despierta
  const matOjo = new THREE.SpriteMaterial({
    map: halo(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const ojos = [-2, 2].map((x) => {
    const s = new THREE.Sprite(matOjo);
    s.position.set(x, 6, 5.7);
    partes.cabeza.grupo.add(s);
    return s;
  });
  // las plantas en cruz de Minecraft no llevan sombreado (shade: false): sin luz, un plano no queda oscuro
  const matAmapola = new THREE.MeshBasicMaterial({
    map: tex.amapola,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    color: "#efe9de",
  });
  const amapola = cruzAmapola(matAmapola, 8);
  // IronGolemFlowerLayer: al medio del brazo, 25 px desde el hombro y 4 px delante de su cara,
  // girada −90° en X del modelo: la flor sale del puño hacia adelante, perpendicular al brazo
  amapola.position.set(0, -25, 7.05);
  amapola.rotation.x = Math.PI / 2;
  partes.brazoD.grupo.add(amapola);
  // ArrowRenderer: dos planos cruzados de 16 × 4 con el lado y un cuadrado con la cola, a 0,05625 bloques
  const flecha = new THREE.Group();
  const matFlecha = new THREE.MeshLambertMaterial({
    map: tex.flecha,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  for (const giro of [0, Math.PI / 2]) {
    const lado = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), matFlecha);
    uvs(lado.geometry, [[0, 0, 16, 5]], 32, 32);
    lado.rotation.x = giro;
    flecha.add(lado);
  }
  const cola = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), matFlecha);
  uvs(cola.geometry, [[0, 5, 5, 10]], 32, 32);
  cola.rotation.y = Math.PI / 2;
  cola.position.x = -7;
  flecha.add(cola);
  flecha.scale.setScalar(0.9);
  flecha.traverse((o) => {
    o.castShadow = (o as THREE.Mesh).isMesh === true;
  });
  flecha.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), FLECHA_DIR);
  partes.torso.grupo.add(flecha);
  return { raiz, partes, ojos, matOjo, matHierro, matAmapola, amapola, flecha };
}
