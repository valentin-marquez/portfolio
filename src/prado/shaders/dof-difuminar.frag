// Profundidad de campo barata, paso 2 y 3: desenfoque gaussiano separable (horizontal y después
// vertical) a media resolución. Cada muestra pesa según lo desenfocada que deba estar: lo nítido casi
// no se derrama sobre el fondo borroso, y lo borroso de adelante sí se derrama sobre todo.
in vec2 v_uv;

uniform sampler2D u_fuente;
uniform vec2 u_paso;  // dirección × separación entre muestras, en uv

out vec4 o;

void main() {
  const float PESOS[5] = float[5](0.2270, 0.1945, 0.1216, 0.0541, 0.0162);
  vec4 centro = texture(u_fuente, v_uv);
  vec3 suma = centro.rgb * PESOS[0] * (0.15 + abs(centro.a));
  float peso = PESOS[0] * (0.15 + abs(centro.a));
  float coc = centro.a * PESOS[0];
  for (int i = 1; i < 5; i++) {
    for (int lado = -1; lado <= 1; lado += 2) {
      vec4 m = texture(u_fuente, v_uv + u_paso * float(i * lado));
      float w = PESOS[i] * (0.15 + abs(m.a));
      suma += m.rgb * w;
      peso += w;
      coc += m.a * PESOS[i];
    }
  }
  o = vec4(suma / peso, coc);
}
