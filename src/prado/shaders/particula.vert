// Lo que cae o flota en el aire: lluvia, nieve o motas de luz. Cada partícula vive en una caja que
// acompaña a la cámara y se recicla sola (mod): no hay nada que simular en la CPU.
layout(location = 0) in vec2 a_esquina;  // -1..1
layout(location = 1) in vec4 a_semilla;  // posición en la caja (0..1) y un azar propio

uniform mat4 u_vistaProy;
uniform vec3 u_camara;
uniform float u_tiempo;
uniform int u_modo;          // 0 lluvia, 1 nieve, 2 motas
uniform float u_deriva;      // m/s hacia +x: el viento las lleva de lado
uniform float u_tanMedio;    // tan(fov / 2)
uniform float u_aspecto;
uniform float u_altoPx;

out vec2 v_q;
out float v_prof;
out float v_azar;
out vec3 v_mundo;

const float CERCA = 0.7;
const float LEJOS = 24.0;

void main() {
  float azar = a_semilla.w;
  // más partículas cerca: a lo lejos se juntan en pantalla
  float z = mix(CERCA, LEJOS, pow(a_semilla.z, 1.6));
  float medio = u_tanMedio * u_aspecto * z * 1.1 + 0.4;

  float alto = u_modo == 0 ? 7.0 : (u_modo == 1 ? 6.0 : 2.4);
  vec3 vel = u_modo == 0 ? vec3(u_deriva * 0.8, -7.0 - azar * 2.5, 0.0)
           : u_modo == 1 ? vec3(u_deriva * 0.6, -0.55 - azar * 0.45, 0.0)
           : vec3(u_deriva * 0.12, 0.025 + azar * 0.02, 0.0);
  float t = u_tiempo;
  float y = mod(a_semilla.y * alto + vel.y * t, alto);
  float x = mod(a_semilla.x * 2.0 * medio + vel.x * t, 2.0 * medio) - medio;
  if (u_modo != 0) {
    // la nieve y las motas no caen derecho: se mecen
    x += sin(t * (0.5 + azar * 0.7) + a_semilla.y * 23.0) * (u_modo == 1 ? 0.14 : 0.08);
    y += sin(t * (0.4 + azar * 0.5) + a_semilla.x * 31.0) * (u_modo == 1 ? 0.05 : 0.1);
  }
  if (u_modo == 2) y += 0.12;
  vec3 p = vec3(u_camara.x + x, y, u_camara.z - z);

  v_azar = azar;
  v_q = a_esquina;
  v_prof = length(p - u_camara);
  v_mundo = p;
  float px = 2.0 / u_altoPx;  // un píxel en NDC vertical

  if (u_modo == 0) {
    // una gota es un trazo en la dirección en que cae, de lo que recorre en 1/16 s
    vec3 dir = normalize(vel);
    vec4 a = u_vistaProy * vec4(p, 1.0);
    vec4 b = u_vistaProy * vec4(p + dir * 0.42, 1.0);
    vec2 sa = a.xy / a.w;
    vec2 sb = b.xy / b.w;
    vec2 d = (sb - sa) * vec2(u_aspecto, 1.0);
    vec2 n = normalize(vec2(-d.y, d.x) + 1e-6) / vec2(u_aspecto, 1.0);
    float grosor = max(1.1 * px, 0.0045 / (z * u_tanMedio));
    float k = a_esquina.x * 0.5 + 0.5;
    vec4 c = mix(a, b, k);
    gl_Position = vec4((mix(sa, sb, k) + n * grosor * 0.5 * a_esquina.y) * c.w, c.z, c.w);
    return;
  }
  float radio = u_modo == 1 ? 0.008 + 0.007 * azar : 0.007 + 0.007 * azar;
  float r = max(radio / (z * u_tanMedio), 1.3 * px);
  vec4 clip = u_vistaProy * vec4(p, 1.0);
  gl_Position = clip + vec4(a_esquina * vec2(r / u_aspecto, r), 0.0, 0.0) * clip.w;
}
