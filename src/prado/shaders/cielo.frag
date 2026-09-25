// Cielo, sol y suelo lejano. Cada píxel lanza su rayo: si toca el suelo, se pinta suelo en bruma a
// su distancia real (la profundidad de campo lo trata bien); si no, cielo con el resplandor del sol.
in vec2 v_uv;
uniform mat4 u_inversa;
uniform vec3 u_camara;
uniform vec3 u_sol;
uniform vec3 u_colorSol;
uniform vec3 u_cieloArriba;
uniform vec3 u_cieloHorizonte;
uniform vec3 u_bruma;
uniform float u_densidadBruma;
uniform vec3 u_tonoSuelo;

layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_prof;

void main() {
  vec2 ndc = v_uv * 2.0 - 1.0;
  vec4 a = u_inversa * vec4(ndc, -1.0, 1.0);
  vec4 b = u_inversa * vec4(ndc, 1.0, 1.0);
  vec3 p0 = a.xyz / a.w;
  vec3 d = normalize(b.xyz / b.w - p0);
  vec3 L = normalize(u_sol);

  if (d.y < -1e-4) {
    float t = -u_camara.y / d.y;
    vec3 punto = u_camara + d * t;
    float mancha = snoise(vec3(punto.xz * 0.4, 3.1)) * 0.5 + 0.5;
    vec3 suelo = u_tonoSuelo * mix(0.75, 1.05, mancha);
    vec3 c = mix(suelo, u_bruma, 1.0 - exp(-t * u_densidadBruma));
    o_color = vec4(c, 1.0);
    o_prof = vec4(t, 0.0, 0.0, 1.0);
    return;
  }

  float e = d.y;
  vec3 c = mix(u_bruma, u_cieloHorizonte, smoothstep(0.0, 0.06, e));
  c = mix(c, u_cieloArriba, smoothstep(0.06, 0.4, e));
  float s = max(dot(d, L), 0.0);
  c = mix(c, u_colorSol, pow(s, 48.0) * 0.35 + pow(s, 4.0) * 0.08);
  o_color = vec4(c, 1.0);
  o_prof = vec4(1000.0, 0.0, 0.0, 1.0);
}
