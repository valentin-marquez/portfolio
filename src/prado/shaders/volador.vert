// Mariposas y hojas: la CPU dice dónde está cada una y cómo va girada; aquí se arma su forma.
// La malla son dos alas (dos cuadriláteros que nacen del eje del cuerpo). Una hoja usa solo una.
layout(location = 0) in vec3 a_malla;  // u (0 en el cuerpo, 1 en la punta), v (-1 atrás, 1 adelante), lado
layout(location = 1) in vec4 a_pos;    // x, y, z, envergadura (m)
layout(location = 2) in vec4 a_giro;   // rumbo, cabeceo, alabeo, aleteo (rad)
layout(location = 3) in vec4 a_tipo;   // tipo (0 mariposa, 1 hoja), variante, alfa

uniform mat4 u_vistaProy;
uniform vec3 u_camara;

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_mundo;
out float v_prof;
flat out int v_tipo;
flat out int v_variante;
out float v_alfa;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }

void main() {
  float lado = a_malla.z;
  vec3 local;
  vec3 n;
  if (a_tipo.x < 0.5) {
    // cada ala gira alrededor del eje del cuerpo: 0 planas, hacia arriba al plegarse
    float ang = a_giro.w;
    float u = a_malla.x;
    local = vec3(lado * u * 0.5 * cos(ang), u * 0.5 * sin(ang), a_malla.y * 0.3);
    n = vec3(-lado * sin(ang), cos(ang), 0.0);
    v_uv = vec2(u, a_malla.y);
  } else {
    // una hoja es un solo plano: la segunda ala queda degenerada, fuera del cuadro
    if (lado < 0.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    float x = a_malla.x * 2.0 - 1.0;
    local = vec3(x * 0.3, 0.0, a_malla.y * 0.5);
    n = vec3(0.0, 1.0, 0.0);
    v_uv = vec2(x, a_malla.y);
  }
  mat3 R = rotY(a_giro.x) * rotX(a_giro.y) * rotZ(a_giro.z);
  vec3 p = a_pos.xyz + R * (local * a_pos.w);
  v_normal = R * n;
  v_mundo = p;
  v_prof = length(p - u_camara);
  v_tipo = int(a_tipo.x + 0.5);
  v_variante = int(a_tipo.y + 0.5);
  v_alfa = a_tipo.z;
  gl_Position = u_vistaProy * vec4(p, 1.0);
}
