// La forma: caja redondeada con sombra de contacto, una pieza líquida adentro y la carátula del
// reproductor. Todo se calcula en px de diseño; la cámara convierte de px físicos a diseño.
uniform vec2 uResolucion;
uniform vec3 uCamara;        // x, y, px físicos por px de diseño (zoom · escala de la vista · dpr)
uniform vec4 uCaja;          // cx, cy, ancho, alto
uniform float uRadio;
uniform vec3 uColorCaja;
uniform vec4 uPieza;         // borde izquierdo, borde derecho, cy, alto
uniform vec3 uColorPieza;
uniform float uOpacidadPieza;
uniform float uCuello;
uniform vec4 uArte;          // cx, cy, lado, radio
uniform float uOpacidadArte;
uniform float uTiempo;
uniform float uFasePulso;    // 0 → 1 dentro de cada pulso
uniform vec3 uLienzo;
uniform vec3 uCieloArriba;
uniform vec3 uCieloHorizonte;
uniform vec3 uPastoBase;
uniform vec3 uPastoCuerpo;
uniform vec3 uPastoPunta;

out vec4 fragColor;

float caja(vec2 p, vec2 medio, float r) {
  vec2 q = abs(p) - medio + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sminimo(float a, float b, float k) {
  if (k <= 1e-4) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// cobertura con antialias de un píxel físico; `escala` pasa la distancia a px físicos
float cubre(float d, float escala) {
  return clamp(0.5 - d * escala, 0.0, 1.0);
}

float capsula(vec2 p, float a, float b, float y, float r) {
  return length(p - vec2(clamp(p.x, a, b), y)) - r;
}

// la pieza: una cápsula que, al estirarse rápido, se afina en el centro como una gota que se separa
float pieza(vec2 p) {
  float r = 0.5 * uPieza.w;
  float a = uPieza.x + r;
  float b = max(uPieza.y - r, a);
  float cuerpo = capsula(p, a, b, uPieza.z, r * (1.0 - uCuello));
  float extremos = min(length(p - vec2(a, uPieza.z)), length(p - vec2(b, uPieza.z))) - r;
  return sminimo(extremos, cuerpo, r * uCuello * 2.5);
}

// una hoja de pasto: curva x = base + inclinación·s²·alto, más fina hacia la punta (distancia en uv)
float hoja(vec2 uv, float base, float alto, float ancho, float inclinacion) {
  float s = clamp(uv.y / alto, 0.0, 1.0);
  float x = base + inclinacion * s * s * alto;
  float dx = abs(uv.x - x) - ancho * (1.0 - s);
  float dy = max(-uv.y, uv.y - alto);
  return max(dx, dy);
}

// la carátula: un prado chico con los colores del portafolio, que se mece al pulso de la cumbia
vec3 prado(vec2 uv, float escala) {
  vec3 c = mix(uCieloHorizonte, uCieloArriba, smoothstep(0.3, 1.0, uv.y));
  float golpe = exp(-uFasePulso * 4.0);
  float viento = 0.1 * sin(uTiempo * 1.3) + 0.22 * golpe;
  float suelo = 0.2 + 0.03 * sin(uv.x * 6.0 + 1.0);
  c = mix(c, uPastoBase, cubre(uv.y - suelo, escala));
  for (int i = 0; i < 28; i++) {
    float fi = float(i);
    float capa = floor(fi / 10.0) / 2.0;
    float base = fract(fi * 0.618034 + 0.13);
    float alto = mix(0.3, 0.62, fract(fi * 0.7548)) * mix(0.75, 1.0, capa);
    float ancho = mix(0.012, 0.022, capa);
    float inclinacion = viento * mix(0.5, 1.0, capa) + (fract(fi * 0.9127) - 0.5) * 0.3;
    float d = hoja(uv - vec2(0.0, suelo - 0.05), base, alto, ancho, inclinacion);
    vec3 tono = mix(uPastoCuerpo, uPastoPunta, clamp((uv.y - suelo) / alto, 0.0, 1.0));
    c = mix(c, mix(tono * 0.8, tono, capa), cubre(d, escala));
  }
  vec2 cabeza = vec2(0.66 + 0.06 * viento, 0.72);
  float altoTallo = cabeza.y - suelo + 0.02;
  float tallo = hoja(uv - vec2(0.0, suelo - 0.02), 0.66, altoTallo, 0.006, 0.06 * viento / altoTallo);
  c = mix(c, uPastoCuerpo, cubre(tallo, escala));
  // la cabeza lleva un borde gris suave: blanca sobre el cielo claro no se distinguía
  float dCabeza = length(uv - cabeza);
  c = mix(c, vec3(0.74, 0.74, 0.68), cubre(dCabeza - 0.09, escala) * 0.7);
  c = mix(c, vec3(0.98, 0.97, 0.94), cubre(dCabeza - 0.074, escala));
  return c;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uResolucion.y - gl_FragCoord.y);
  float z = uCamara.z;
  vec2 p = (frag - 0.5 * uResolucion) / z + uCamara.xy;
  vec3 c = uLienzo;

  vec2 medio = 0.5 * uCaja.zw;
  float r = min(uRadio, min(medio.x, medio.y));
  vec2 q = p - uCaja.xy;

  // sombra de contacto: suave, corrida hacia abajo, sin brillo
  float ds = caja(q - vec2(0.0, 3.0), medio, r);
  c = mix(c, vec3(0.16, 0.14, 0.1), (1.0 - smoothstep(-2.0, 14.0, ds)) * 0.12);

  float d = caja(q, medio, r);
  vec3 cc = uColorCaja;
  // filete de un píxel físico: separa las cajas claras del lienzo claro
  float luma = dot(cc, vec3(0.2126, 0.7152, 0.0722));
  float px = 1.0 / z;
  cc = mix(cc, vec3(0.0), cubre(abs(d + 0.5 * px) - 0.5 * px, z) * 0.07 * luma);

  float dp = max(pieza(p), d);
  cc = mix(cc, uColorPieza, cubre(dp, z) * uOpacidadPieza);

  if (uOpacidadArte > 0.001) {
    vec2 qa = p - uArte.xy;
    float da = caja(qa, vec2(0.5 * uArte.z), uArte.w);
    vec2 uv = qa / uArte.z + 0.5;
    uv.y = 1.0 - uv.y;
    cc = mix(cc, prado(uv, uArte.z * z), cubre(da, z) * uOpacidadArte);
  }

  c = mix(c, cc, cubre(d, z));
  fragColor = vec4(c, 1.0);
}
