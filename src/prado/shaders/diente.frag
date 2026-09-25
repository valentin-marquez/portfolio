// Vilanos: velo esponjoso con hebras radiales, puntas claras y un centro pardo.
in vec2 v_q;
in float v_prof;

uniform vec3 u_colorSol;
uniform vec3 u_bruma;
uniform float u_densidadBruma;
uniform float u_tramado;  // 1 sin MSAA: la cobertura se resuelve con un tramado estocástico

layout(location = 0) out vec4 o_color;
layout(location = 1) out vec4 o_prof;

void main() {
  float r = length(v_q);
  if (r > 1.0) discard;
  float a = atan(v_q.y, v_q.x);
  // cada hebra con su propio largo y su punta solo en el extremo: de cerca se ve un vilano, no un anillo
  float giro = a / 6.2831853 * 22.0 + snoise(vec3(v_q * 2.5, 0.0)) * 0.25;
  float fil = abs(fract(giro) - 0.5);
  float largo = 0.78 + 0.2 * fract(sin(floor(giro) * 12.9898) * 43758.5453);
  float hebra = smoothstep(0.22, 0.0, fil) * smoothstep(largo, largo - 0.55, r);
  float velo = smoothstep(0.8, 0.3, r) * 0.5;
  float punta = smoothstep(0.1, 0.0, abs(r - largo)) * smoothstep(0.32, 0.0, fil) * 0.8;
  float centro = smoothstep(0.16, 0.1, r);
  float cobertura = clamp(max(max(hebra * 0.9, velo), max(punta, centro)), 0.0, 1.0);
  if (cobertura < 0.02) discard;
  if (u_tramado > 0.5 && cobertura < fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453)) {
    discard;
  }
  vec3 c = mix(vec3(0.97, 0.96, 0.92), vec3(0.62, 0.55, 0.42), centro) + u_colorSol * 0.06;
  c = mix(c, u_bruma, 1.0 - exp(-v_prof * u_densidadBruma));
  o_color = vec4(c, cobertura);
  o_prof = vec4(v_prof, 0.0, 0.0, 1.0);
}
