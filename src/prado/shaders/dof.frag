// Profundidad de campo por recolección (gather) en espiral áurea. Cada muestra aporta si su propio
// círculo de confusión alcanza este píxel; lo que está detrás limita su círculo al del centro, así
// el fondo borroso no se derrama sobre lo nítido y el frente borroso sí se derrama sobre todo.
in vec2 v_uv;

uniform sampler2D u_color;
uniform sampler2D u_prof;
uniform vec2 u_texel;      // 1 / resolución
uniform float u_foco;      // distancia al plano de foco, en metros
uniform float u_rango;     // metros hasta el desenfoque máximo
uniform float u_radioMax;  // radio máximo en px
uniform int u_muestras;

out vec4 o;

float coc(float d) { return clamp(abs(d - u_foco) / u_rango, 0.0, 1.0) * u_radioMax; }

void main() {
  float dC = texture(u_prof, v_uv).r;
  float cC = coc(dC);
  vec3 suma = texture(u_color, v_uv).rgb;
  float peso = 1.0;
  const float AUREO = 2.39996323;
  for (int i = 1; i < 64; i++) {
    if (i >= u_muestras) break;
    float r = sqrt(float(i) / float(u_muestras)) * u_radioMax;
    float a = float(i) * AUREO;
    vec2 uv = v_uv + vec2(cos(a), sin(a)) * r * u_texel;
    float dM = texture(u_prof, uv).r;
    float cM = coc(dM);
    if (dM > dC) cM = min(cM, cC);
    float w = smoothstep(r - 1.0, r + 1.0, cM);
    suma += texture(u_color, uv).rgb * w;
    peso += w;
  }
  o = vec4(suma / peso, 1.0);
}
