// El dibujo de una mariposa o de una hoja. Las alas y las hojas son finas: a contraluz el sol las
// atraviesa y se encienden, como el pasto.
in vec2 v_uv;
in vec3 v_normal;
in vec3 v_mundo;
in float v_prof;
flat in int v_tipo;
flat in int v_variante;
in float v_alfa;

uniform vec3 u_camara;
uniform vec3 u_sol;
uniform vec3 u_colorSol;
uniform vec3 u_ambiente;
uniform vec3 u_bruma;
uniform float u_densidadBruma;

layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_prof;

// 1 dentro de la elipse, 0 fuera, con el borde suavizado a un píxel
float elipse(vec2 p, vec2 centro, vec2 radio, float giro) {
  vec2 d = p - centro;
  float c = cos(giro), s = sin(giro);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / radio;
  float e = 1.0 - length(d);
  return clamp(e / max(fwidth(e), 1e-4), 0.0, 1.0);
}

float elipseSuave(vec2 p, vec2 centro, vec2 radio, float giro) {
  vec2 d = p - centro;
  float c = cos(giro), s = sin(giro);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / radio;
  return 1.0 - length(d);
}

void mariposa(out vec3 color, out float alfa) {
  vec2 p = v_uv;  // u: del cuerpo a la punta; v: de atrás hacia adelante
  float ante = elipse(p, vec2(0.5, 0.36), vec2(0.52, 0.4), -0.35);
  float post = elipse(p, vec2(0.36, -0.4), vec2(0.36, 0.38), 0.25);
  float ala = max(ante, post);
  // qué tan adentro del ala: 0 en el borde, crece hacia el centro
  float hondo = max(elipseSuave(p, vec2(0.5, 0.36), vec2(0.52, 0.4), -0.35),
                    elipseSuave(p, vec2(0.36, -0.4), vec2(0.36, 0.38), 0.25));
  float cuerpo = step(p.x, 0.045) * smoothstep(0.6, 0.48, abs(p.y));
  alfa = max(ala, cuerpo);

  vec3 base;
  vec3 borde = vec3(0.16, 0.13, 0.11);
  float marca = 0.0;
  if (v_variante == 0) {
    // blanca, con la punta del ala delantera gris y un punto oscuro
    base = vec3(0.97, 0.96, 0.91);
    marca = max(smoothstep(0.55, 0.9, p.x + p.y * 0.4) * ante * 0.8,
                elipse(p, vec2(0.55, 0.3), vec2(0.06, 0.06), 0.0) * 0.9);
  } else if (v_variante == 1) {
    // amarilla, con un borde fino más oscuro
    base = vec3(0.95, 0.84, 0.47);
    borde = vec3(0.45, 0.3, 0.1);
    marca = smoothstep(0.14, 0.04, hondo) * 0.85;
  } else if (v_variante == 2) {
    // dama pintada: naranja, punta negra con manchas blancas
    base = vec3(0.86, 0.5, 0.22);
    float punta = smoothstep(0.6, 0.8, p.x + p.y * 0.55) * ante;
    float manchas = elipse(p, vec2(0.78, 0.5), vec2(0.07, 0.05), 0.0) + elipse(p, vec2(0.66, 0.62), vec2(0.05, 0.04), 0.0);
    marca = max(punta, smoothstep(0.12, 0.03, hondo)) * (1.0 - manchas);
    base = mix(base, vec3(0.98, 0.95, 0.9), manchas * punta);
  } else {
    // azulita, pequeña y pálida
    base = vec3(0.64, 0.74, 0.92);
    marca = smoothstep(0.1, 0.03, hondo) * 0.6;
  }
  color = mix(base, borde, clamp(marca, 0.0, 1.0));
  // más oscuro junto al cuerpo, donde el ala tiene escamas más densas
  color *= mix(0.72, 1.0, smoothstep(0.0, 0.4, p.x));
  color = mix(color, vec3(0.16, 0.13, 0.11), cuerpo);
}

void hoja(out vec3 color, out float alfa) {
  vec2 p = v_uv;  // x: -1..1 a lo ancho; y: -1 en el tallo, 1 en la punta
  float perfil = pow(max(0.0, 1.0 - p.y * p.y), 0.7) * (1.0 - 0.25 * p.y) * 0.92;
  float e = perfil - abs(p.x);
  alfa = clamp(e / max(fwidth(e), 1e-4), 0.0, 1.0);
  float tallo = step(p.y, -0.8) * step(abs(p.x), 0.05);
  alfa = max(alfa, tallo);
  vec3 tonos[4] = vec3[4](vec3(0.8, 0.55, 0.2), vec3(0.72, 0.28, 0.12), vec3(0.87, 0.69, 0.24), vec3(0.53, 0.36, 0.2));
  color = tonos[v_variante % 4];
  // nervio central y un poco de manchado
  color *= 1.0 - 0.3 * smoothstep(0.05, 0.0, abs(p.x)) * step(p.y, 0.85);
  color *= 0.9 + 0.1 * sin(p.x * 9.0 + p.y * 5.0);
}

void main() {
  vec3 base;
  float alfa;
  if (v_tipo == 0) mariposa(base, alfa);
  else hoja(base, alfa);
  alfa *= v_alfa;
  if (alfa < 0.02) discard;

  vec3 N = normalize(v_normal);
  vec3 V = normalize(u_camara - v_mundo);
  if (dot(N, V) < 0.0) N = -N;
  vec3 L = normalize(u_sol);
  float difusa = max(dot(N, L), 0.0) * 0.5 + 0.5;
  float trans = pow(max(dot(-V, L), 0.0), 3.0) * 0.8;
  vec3 c = base * (u_ambiente + u_colorSol * difusa * 0.55) + base * u_colorSol * trans;
  c = mix(c, u_bruma, 1.0 - exp(-v_prof * u_densidadBruma));
  o_color = vec4(c * alfa, alfa);
  o_prof = vec4(v_prof, 0.0, 0.0, 1.0);
}
