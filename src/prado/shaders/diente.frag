// Cabeza de diente de león (el "reloj"): hebras radiales de largo propio, cada una con su paraguas de
// vilano en la punta, sobre un volumen translúcido que brilla en el borde porque el sol viene de atrás.
// El detalle crece con el tamaño en pantalla: de lejos es un copo, de cerca se ven las hebras.
in vec2 v_q;
in float v_prof;
in float v_pixeles;
in float v_deshecho;

uniform vec3 u_colorSol;
uniform vec3 u_bruma;
uniform float u_densidadBruma;

layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_prof;

float azar(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

void main() {
  float r = length(v_q);
  if (r > 1.0) discard;
  float a = atan(v_q.y, v_q.x + 1e-5);
  float n = clamp(v_pixeles * 1.6, 24.0, 140.0);
  float giro = a / 6.2831853 * n;
  float indice = floor(giro);
  float largo = 0.7 + 0.28 * azar(indice);
  float fil = abs(fract(giro) - 0.5);
  // de cerca las hebras se afinan: en proporción al tamaño, no al ángulo
  float ancho = mix(0.2, 0.07, clamp(v_pixeles / 70.0, 0.0, 1.0));
  // al soplarla, cada semilla se va en su momento: las que tienen azar menor que lo deshecho ya no están
  float queda = step(v_deshecho, azar(indice + 9.1) * 0.98 + 0.01);
  float hebra = smoothstep(ancho, 0.0, fil) * smoothstep(largo + 0.02, largo - 0.12, r) * smoothstep(0.07, 0.2, r) * queda;
  float angPunta = (indice + 0.5) / n * 6.2831853;
  vec2 punta = vec2(cos(angPunta), sin(angPunta)) * largo;
  float paraguas = smoothstep(0.08 + 0.05 * azar(indice + 3.1), 0.0, length(v_q - punta)) * queda;
  // la cabeza es una esfera: muchas semillas apuntan hacia la cámara y sus paraguas llenan el disco,
  // repartidos en capas por dentro; solo se distinguen cuando la cabeza se ve grande
  float interior = 0.0;
  for (int k = 0; k < 3; k++) {
    float capa = 0.28 + 0.2 * float(k);
    float nk = max(6.0, floor(n * capa * 0.85));
    float gk = a / 6.2831853 * nk + azar(float(k) * 7.3);
    float ik = floor(gk);
    float ak = (ik + 0.5 + (azar(ik + float(k) * 13.0) - 0.5) * 0.7) / nk * 6.2831853 - azar(float(k) * 7.3) / nk * 6.2831853;
    float rk = capa + (azar(ik * 3.7 + float(k)) - 0.5) * 0.14;
    float quedaK = step(v_deshecho, azar(ik * 5.3 + float(k)) * 0.98 + 0.01);
    interior = max(interior, smoothstep(0.075, 0.0, length(v_q - vec2(cos(ak), sin(ak)) * rk)) * quedaK);
  }
  interior *= smoothstep(18.0, 45.0, v_pixeles) * 0.75;
  // volumen translúcido, más luminoso hacia el borde (contraluz)
  float volumen = (smoothstep(1.0, 0.45, r) * 0.34 + smoothstep(0.5, 0.88, r) * smoothstep(1.0, 0.88, r) * 0.26) * (1.0 - v_deshecho);
  // pelada queda el receptáculo: un botón pardo algo más grande
  float centro = smoothstep(0.1 + 0.05 * v_deshecho, 0.06 + 0.04 * v_deshecho, r);
  float alfa = clamp(max(max(hebra * 0.6, paraguas * 0.9), max(max(volumen, interior), centro)), 0.0, 1.0);
  if (alfa < 0.02) discard;
  vec3 blanco = vec3(0.98, 0.97, 0.93) + u_colorSol * 0.12 * smoothstep(0.4, 0.95, r);
  vec3 c = mix(blanco, vec3(0.55, 0.47, 0.36), centro);
  c = mix(c, u_bruma, 1.0 - exp(-v_prof * u_densidadBruma));
  // alfa premultiplicado: se mezcla sobre el pasto; la profundidad se reemplaza donde hay cabeza
  o_color = vec4(c * alfa, alfa);
  o_prof = vec4(v_prof, 0.0, 0.0, 1.0);
}
