// Polen: motas en el aire que derivan con el viento, relativas a la cámara y recicladas en su volumen.
layout(location = 0) in vec2 a_esquina;  // -1..1
layout(location = 1) in vec4 a_mota;     // x, y, z relativos a la cámara; fase

uniform mat4 u_vistaProy;
uniform vec3 u_camara;
uniform float u_tiempo;
uniform float u_movimiento;
uniform float u_aspecto;
uniform float u_rafagaFuerza;

out vec2 v_q;
out float v_prof;
out float v_brillo;

void main() {
  float t = u_tiempo;
  float fase = a_mota.w * 6.2831853;
  // deriva con el viento (hacia +x), un poco más en las ráfagas; se recicla dentro de ±7 m
  float x = mod(a_mota.x + 7.0 + t * (0.18 + 0.35 * u_rafagaFuerza) * u_movimiento, 14.0) - 7.0;
  float y = a_mota.y + sin(t * 0.45 + fase) * 0.12 * u_movimiento;
  float z = a_mota.z + sin(t * 0.3 + fase * 1.7) * 0.15 * u_movimiento;
  vec3 p = vec3(u_camara.x + x, y, u_camara.z + z);
  vec4 clip = u_vistaProy * vec4(p, 1.0);
  float radio = 0.016 + 0.01 * a_mota.w;
  vec4 borde = u_vistaProy * vec4(p + vec3(radio, 0.0, 0.0), 1.0);
  float r = abs(borde.x / borde.w - clip.x / clip.w);
  v_q = a_esquina;
  v_prof = length(p - u_camara);
  // titilan despacio al girar con la luz
  v_brillo = 0.55 + 0.45 * sin(t * 1.3 + fase * 3.0);
  gl_Position = clip + vec4(a_esquina * r * vec2(1.0, u_aspecto), 0.0, 0.0) * clip.w;
}
