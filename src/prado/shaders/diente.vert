// Cabeza del diente de león: un billboard en la punta de su tallo.
layout(location = 0) in vec2 a_esquina;  // -1..1
layout(location = 1) in vec4 a_raiz;
layout(location = 2) in vec4 a_forma;

uniform float u_radioCabeza;
uniform float u_aspecto;
uniform float u_anchoPx;  // ancho del objetivo en px, para saber qué tan grande se ve

out vec2 v_q;
out float v_prof;
out float v_pixeles;

void main() {
  vec3 normal;
  float viento;
  vec3 punta = posicionHoja(a_raiz, a_forma, 1.0, 0.0, normal, viento);
  vec4 clip = u_vistaProy * vec4(punta, 1.0);
  vec4 borde = u_vistaProy * vec4(punta + vec3(u_radioCabeza, 0.0, 0.0), 1.0);
  float r = abs(borde.x / borde.w - clip.x / clip.w);
  v_q = a_esquina;
  v_prof = length(punta - u_camara);
  v_pixeles = r * u_anchoPx * 0.5;
  gl_Position = clip + vec4(a_esquina * r * vec2(1.0, u_aspecto), 0.0, 0.0) * clip.w;
}
