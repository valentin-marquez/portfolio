// Semilla como sprite girado, en px CSS de la ventana.
layout(location = 0) in vec2 a_esquina;       // -1..1
layout(location = 1) in vec3 a_centroTam;     // x, y, tamaño (px CSS)
layout(location = 2) in vec3 a_alfaDesGiro;   // alfa, desenfoque 0..1, giro (rad)

uniform vec2 u_pantalla;  // px CSS

out vec2 v_q;
out float v_alfa;
out float v_des;

void main() {
  float c = cos(a_alfaDesGiro.z);
  float s = sin(a_alfaDesGiro.z);
  vec2 q = a_esquina;
  vec2 px = a_centroTam.xy + vec2(c * q.x - s * q.y, s * q.x + c * q.y) * a_centroTam.z;
  v_q = vec2(q.x, -q.y);  // en el sprite, y hacia arriba: vilano arriba, aquenio abajo
  v_alfa = a_alfaDesGiro.x;
  v_des = a_alfaDesGiro.y;
  gl_Position = vec4(px.x / u_pantalla.x * 2.0 - 1.0, 1.0 - px.y / u_pantalla.y * 2.0, 0.0, 1.0);
}
