layout(location = 0) in vec2 a_malla;  // v, lado
layout(location = 1) in vec4 a_raiz;   // x, z, altura, ancho
layout(location = 2) in vec4 a_forma;  // curva, orientación, tono, fase

out float v_v;
out float v_tono;
out float v_viento;
out vec3 v_normal;
out vec3 v_mundo;
out float v_prof;

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
  gl_Position = u_vistaProy * vec4(p, 1.0);
}
