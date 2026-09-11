precision highp float;

// La posición se saca de gl_FragCoord y no de un varying: así el shader no
// depende de qué atributos traiga la geometría que lo dibuja.
uniform vec2  uResolucion;
uniform float uTiempo;
uniform float uAngulo;      // grados: nada se alinea al eje
uniform float uDensidad;    // trama del semitono
uniform float uBandas;
uniform float uSemitono;
uniform float uGrano;
uniform float uDesregistro;

uniform vec3 uTinta;
uniform vec3 uCrema;
uniform vec3 uMostaza;
uniform vec3 uNaranja;

mat2 giro(float grados) {
  float a = radians(grados);
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float azar(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

/**
 * Semitono de imprenta: puntos de TINTA sobre el campo de color, no un velo
 * encima. La cobertura barre en diagonal para que la trama respire.
 */
float trama(vec2 uv, float cobertura, mat2 R) {
  vec2 p = R * uv * uDensidad;
  vec2 celda = fract(p) - 0.5;
  float r = sqrt(clamp(cobertura, 0.0, 1.0)) * 0.55;
  float aa = fwidth(length(celda)) * 1.1 + 0.004;
  return smoothstep(r + aa, r - aa, length(celda));
}

vec3 mundo(vec2 uv) {
  mat2 R = giro(uAngulo);
  vec3 col = uTinta;

  if (uBandas > 0.5) {
    float f = (R * uv).x * 4.8 + uTiempo * 0.16;
    int i = int(mod(floor(f), 5.0));
    // la tinta entra como banda propia: en el arte clave el negro es el 42,6%
    vec3 c = i == 0 ? uCrema
           : i == 1 ? uTinta
           : i == 2 ? uMostaza
           : i == 3 ? uTinta
                    : uNaranja;
    float borde = abs(fract(f) - 0.5);
    col = mix(uTinta, c, smoothstep(0.47, 0.43, borde));
  }

  if (uSemitono > 0.5) {
    float cobertura = 0.5 + 0.5 * sin((R * uv).x * 2.0 - uTiempo * 0.9);
    col = mix(col, uTinta, trama(uv, cobertura * 0.85, R) * 0.62);
  }

  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolucion) / uResolucion.y;

  vec3 col;
  if (uDesregistro > 0.5) {
    // los canales no caen en el mismo sitio, como una impresión mal registrada
    vec2 o = vec2(1.1, -0.7) / uResolucion.y;
    col = vec3(mundo(uv + o).r, mundo(uv).g, mundo(uv - o).b);
  } else {
    col = mundo(uv);
  }

  if (uGrano > 0.5) {
    vec2 px = gl_FragCoord.xy;
    float g = azar(px + fract(uTiempo) * 91.0);
    float fibra = azar(floor(px * 0.35));
    col *= 0.93 + 0.09 * g;
    col = mix(col, col * (0.95 + 0.08 * fibra), 0.55);
  }

  gl_FragColor = vec4(col, 1.0);
}
