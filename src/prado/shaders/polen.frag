// Mota de polen: un punto tibio y suave. La profundidad de campo convierte a las cercanas y lejanas en bokeh.
in vec2 v_q;
in float v_prof;
in float v_brillo;

uniform vec3 u_colorSol;
uniform vec3 u_bruma;
uniform float u_densidadBruma;

layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_prof;

void main() {
  float r = length(v_q);
  if (r > 1.0) discard;
  float alfa = smoothstep(1.0, 0.2, r) * 0.85 * v_brillo;
  if (alfa < 0.02) discard;
  vec3 c = mix(vec3(1.0, 0.96, 0.84), u_colorSol, 0.35) * 1.08;
  c = mix(c, u_bruma, (1.0 - exp(-v_prof * u_densidadBruma)) * 0.6);
  o_color = vec4(c * alfa, alfa);
  o_prof = vec4(v_prof, 0.0, 0.0, 1.0);
}
