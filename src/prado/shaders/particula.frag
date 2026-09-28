// Gota, copo o mota. Van con alfa premultiplicado sobre la escena y mueven la profundidad en
// proporción a su opacidad: un copo cercano se desenfoca como un copo cercano.
in vec2 v_q;
in float v_prof;
in float v_azar;
in vec3 v_mundo;

uniform int u_modo;
uniform float u_tiempo;
uniform float u_opacidad;
uniform vec3 u_camara;
uniform vec3 u_sol;
uniform vec3 u_colorSol;
uniform vec3 u_colorMotas;
uniform vec3 u_bruma;
uniform float u_densidadBruma;

layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_prof;

void main() {
  float a;
  vec3 c;
  if (u_modo == 0) {
    // cola tenue, cuerpo algo más claro; casi transparente: la lluvia se ve por el movimiento
    float largo = v_q.x * 0.5 + 0.5;
    a = (1.0 - abs(v_q.y)) * smoothstep(0.0, 0.5, largo) * smoothstep(1.0, 0.75, largo) * 0.32;
    c = vec3(0.86, 0.89, 0.9);
  } else if (u_modo == 1) {
    // los copos pegados a la cámara serían manchas: se desvanecen antes de llegar
    float r = length(v_q);
    a = smoothstep(1.0, 0.3, r) * 0.9 * smoothstep(0.8, 2.2, v_prof);
    c = vec3(0.975, 0.98, 1.0);
  } else {
    // una mota brilla más cuando está entre la cámara y el sol, y titila apenas
    float r = length(v_q);
    vec3 V = normalize(u_camara - v_mundo);
    float contraluz = pow(max(dot(-V, normalize(u_sol)), 0.0), 4.0);
    a = pow(smoothstep(1.0, 0.0, r), 1.4) * (0.6 + 0.4 * contraluz);
    a *= 0.75 + 0.25 * sin(u_tiempo * (1.3 + v_azar) + v_azar * 40.0);
    c = u_colorMotas * (0.9 + 0.3 * contraluz) + u_colorSol * 0.1;
  }
  a *= u_opacidad;
  if (a < 0.003) discard;
  c = mix(c, u_bruma, 1.0 - exp(-v_prof * u_densidadBruma));
  o_color = vec4(c * a, a);
  o_prof = vec4(v_prof * a, 0.0, 0.0, a);
}
