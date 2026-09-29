layout(location = 0) in vec2 a_malla;  // v, lado
layout(location = 1) in vec4 a_raiz;   // x, z, altura, ancho
layout(location = 2) in vec4 a_forma;  // curva, orientación, tono, fase

out float v_v;
out float v_tono;
out float v_viento;
out vec3 v_normal;
out vec3 v_mundo;
out float v_prof;
out float v_mancha;
out float v_nube;

uniform vec2 u_nubes;  // desplazamiento de las sombras de nubes, empujadas por el viento

void main() {
  vec3 normal;
  float viento;
  vec3 p = posicionHoja(a_raiz, a_forma, a_malla.x, a_malla.y, normal, viento);
  v_v = a_malla.x;
  v_tono = a_forma.z;
  v_viento = viento;
  v_normal = normal;
  v_mundo = p;
  v_prof = length(p - u_camara);
  // manchas del pasto y sombras de nubes: cambian a escala de metros, así que basta calcularlas en
  // cada vértice y no en cada píxel (ahorra tres ruidos por píxel, que era lo más caro del pasto)
  v_mancha = snoise(vec3(p.xz * 0.35, 1.7)) * 0.5 + 0.5;
  vec2 pn = p.xz + u_nubes;
#ifdef LIGERA
  v_nube = smoothstep(0.1, 0.6, snoise(vec3(pn * 0.035, 0.7)) * 0.75);
#else
  v_nube = smoothstep(0.1, 0.6, snoise(vec3(pn * 0.035, 0.7)) * 0.6 + snoise(vec3(pn * 0.09, 2.3)) * 0.4);
#endif
  gl_Position = u_vistaProy * vec4(p, 1.0);
}
