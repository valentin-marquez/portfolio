// Álgebra mínima de cámara, column-major como la espera WebGL.
export type Mat4 = Float32Array;
export type Vec3 = { x: number; y: number; z: number };

export function perspectiva(
  fovGrados: number,
  aspecto: number,
  cerca: number,
  lejos: number,
): Mat4 {
  const f = 1 / Math.tan((fovGrados * Math.PI) / 360);
  const nf = 1 / (cerca - lejos);
  const m = new Float32Array(16);
  m[0] = f / aspecto;
  m[5] = f;
  m[10] = (lejos + cerca) * nf;
  m[11] = -1;
  m[14] = 2 * lejos * cerca * nf;
  return m;
}

export function mirarA(ojo: Vec3, objetivo: Vec3, arriba: Vec3 = { x: 0, y: 1, z: 0 }): Mat4 {
  let zx = ojo.x - objetivo.x;
  let zy = ojo.y - objetivo.y;
  let zz = ojo.z - objetivo.z;
  let l = Math.hypot(zx, zy, zz);
  zx /= l;
  zy /= l;
  zz /= l;
  let xx = arriba.y * zz - arriba.z * zy;
  let xy = arriba.z * zx - arriba.x * zz;
  let xz = arriba.x * zy - arriba.y * zx;
  l = Math.hypot(xx, xy, xz);
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  const m = new Float32Array(16);
  m[0] = xx;
  m[1] = yx;
  m[2] = zx;
  m[4] = xy;
  m[5] = yy;
  m[6] = zy;
  m[8] = xz;
  m[9] = yz;
  m[10] = zz;
  m[12] = -(xx * ojo.x + xy * ojo.y + xz * ojo.z);
  m[13] = -(yx * ojo.x + yy * ojo.y + yz * ojo.z);
  m[14] = -(zx * ojo.x + zy * ojo.y + zz * ojo.z);
  m[15] = 1;
  return m;
}

export function multiplicar(a: Mat4, b: Mat4): Mat4 {
  const m = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += (a[k * 4 + r] as number) * (b[c * 4 + k] as number);
      m[c * 4 + r] = s;
    }
  }
  return m;
}

export function invertir(m: Mat4): Mat4 | null {
  const a = Array.from(m);
  const g = (i: number) => a[i] as number;
  const b00 = g(0) * g(5) - g(1) * g(4);
  const b01 = g(0) * g(6) - g(2) * g(4);
  const b02 = g(0) * g(7) - g(3) * g(4);
  const b03 = g(1) * g(6) - g(2) * g(5);
  const b04 = g(1) * g(7) - g(3) * g(5);
  const b05 = g(2) * g(7) - g(3) * g(6);
  const b06 = g(8) * g(13) - g(9) * g(12);
  const b07 = g(8) * g(14) - g(10) * g(12);
  const b08 = g(8) * g(15) - g(11) * g(12);
  const b09 = g(9) * g(14) - g(10) * g(13);
  const b10 = g(9) * g(15) - g(11) * g(13);
  const b11 = g(10) * g(15) - g(11) * g(14);
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (Math.abs(det) < 1e-12) return null;
  const d = 1 / det;
  return new Float32Array([
    (g(5) * b11 - g(6) * b10 + g(7) * b09) * d,
    (g(2) * b10 - g(1) * b11 - g(3) * b09) * d,
    (g(13) * b05 - g(14) * b04 + g(15) * b03) * d,
    (g(10) * b04 - g(9) * b05 - g(11) * b03) * d,
    (g(6) * b08 - g(4) * b11 - g(7) * b07) * d,
    (g(0) * b11 - g(2) * b08 + g(3) * b07) * d,
    (g(14) * b02 - g(12) * b05 - g(15) * b01) * d,
    (g(8) * b05 - g(10) * b02 + g(11) * b01) * d,
    (g(4) * b10 - g(5) * b08 + g(7) * b06) * d,
    (g(1) * b08 - g(0) * b10 - g(3) * b06) * d,
    (g(12) * b04 - g(13) * b02 + g(15) * b00) * d,
    (g(9) * b02 - g(8) * b04 - g(11) * b00) * d,
    (g(5) * b07 - g(4) * b09 - g(6) * b06) * d,
    (g(0) * b09 - g(1) * b07 + g(2) * b06) * d,
    (g(13) * b01 - g(12) * b03 - g(14) * b00) * d,
    (g(8) * b03 - g(9) * b01 + g(10) * b00) * d,
  ]);
}

function transformar(m: Mat4, x: number, y: number, z: number, w: number) {
  const g = (i: number) => m[i] as number;
  return {
    x: g(0) * x + g(4) * y + g(8) * z + g(12) * w,
    y: g(1) * x + g(5) * y + g(9) * z + g(13) * w,
    z: g(2) * x + g(6) * y + g(10) * z + g(14) * w,
    w: g(3) * x + g(7) * y + g(11) * z + g(15) * w,
  };
}

/** Coordenadas NDC (x, y en -1..1) y w de clip. */
export function proyectar(m: Mat4, p: Vec3): { x: number; y: number; w: number } {
  const c = transformar(m, p.x, p.y, p.z, 1);
  return { x: c.x / c.w, y: c.y / c.w, w: c.w };
}

/** Intersección del rayo que pasa por (ndcX, ndcY) con el plano horizontal y = altura; null si no lo toca. */
export function rayoAPlano(inversa: Mat4, ndcX: number, ndcY: number, altura: number): Vec3 | null {
  const a = transformar(inversa, ndcX, ndcY, -1, 1);
  const b = transformar(inversa, ndcX, ndcY, 1, 1);
  const p0 = { x: a.x / a.w, y: a.y / a.w, z: a.z / a.w };
  const p1 = { x: b.x / b.w, y: b.y / b.w, z: b.z / b.w };
  const dy = p1.y - p0.y;
  if (Math.abs(dy) < 1e-9) return null;
  const t = (altura - p0.y) / dy;
  if (t < 0 || t > 1) return null;
  return { x: p0.x + (p1.x - p0.x) * t, y: altura, z: p0.z + (p1.z - p0.z) * t };
}

/** Intersección del rayo que pasa por (ndcX, ndcY) con el suelo (y = 0); null si no lo toca. */
export function rayoASuelo(inversa: Mat4, ndcX: number, ndcY: number): Vec3 | null {
  return rayoAPlano(inversa, ndcX, ndcY, 0);
}
