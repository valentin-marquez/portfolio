// Color de una hoja: base oscura (oclusión), cuerpo salvia y punta cálida; el sol viene de atrás y
// atraviesa las hojas finas (translucidez). La bruma la lava con la distancia.
in float v_v;
in float v_tono;
in float v_viento;
in vec3 v_normal;
in vec3 v_mundo;
in float v_prof;

uniform vec3 u_camara;
uniform vec3 u_tonoBase;
uniform vec3 u_tonoCuerpo;
uniform vec3 u_tonoPunta;
uniform vec3 u_tonoTallo;
uniform vec3 u_sol;
uniform vec3 u_colorSol;
uniform vec3 u_ambiente;
uniform float u_translucidez;
uniform vec3 u_bruma;
uniform float u_densidadBruma;
uniform int u_vista;
uniform vec2 u_nubes;  // desplazamiento de las sombras de nubes, empujadas por el viento

layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_prof;

void main() {
  vec3 N = normalize(v_normal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(u_camara - v_mundo);
  vec3 L = normalize(u_sol);

  vec3 base = v_tono > 1.5
    ? u_tonoTallo
    : mix(mix(u_tonoBase, u_tonoCuerpo, smoothstep(0.0, 0.45, v_v)), u_tonoPunta, smoothstep(0.55, 1.0, v_v));
  // manchas amplias y variación por hoja, para que el campo no sea un verde plano
  float mancha = snoise(vec3(v_mundo.xz * 0.35, 1.7)) * 0.5 + 0.5;
  base *= mix(0.86, 1.08, mancha) * mix(0.94, 1.06, fract(v_tono * 7.31));

  // sombras de nubes: manchas amplias y suaves que cruzan despacio el prado
  vec2 pn = v_mundo.xz + u_nubes;
  float nube = smoothstep(0.1, 0.6, snoise(vec3(pn * 0.035, 0.7)) * 0.6 + snoise(vec3(pn * 0.09, 2.3)) * 0.4);
  vec3 luzSol = u_colorSol * mix(1.0, 0.5, nube);

  float ao = mix(0.35, 1.0, smoothstep(0.0, 0.4, v_v));
  float difusa = max(dot(N, L), 0.0) * 0.6 + 0.4;  // luz envolvente: la hoja es fina
  float trans = pow(max(dot(-V, L), 0.0), 3.0) * u_translucidez * smoothstep(0.2, 1.0, v_v);
  vec3 color = base * (u_ambiente + luzSol * difusa * 0.55) * ao + luzSol * base * trans;
  color = mix(color, u_bruma, 1.0 - exp(-v_prof * u_densidadBruma));

  if (u_vista == 3) color = vec3(clamp(0.5 + v_viento, 0.0, 1.0));
  o_color = vec4(color, 1.0);
  o_prof = vec4(v_prof, 0.0, 0.0, 1.0);
}
