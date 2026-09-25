// Composición final: el prado se disuelve en la página por los bordes (alfa premultiplicado, así se
// ve el fondo crema detrás) y lleva un grano de película suave. También muestra vistas de depuración.
in vec2 v_uv;

uniform sampler2D u_dof;
uniform sampler2D u_prof;
uniform vec2 u_borde;       // ancho del fundido en x e y, como fracción
uniform float u_ruidoBorde;
uniform float u_grano;
uniform float u_tiempo;
uniform float u_foco;
uniform float u_rango;
uniform int u_vista;        // 0 final, 1 profundidad, 2 círculo de confusión, 3 viento

out vec4 o;

float azar(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec3 c = texture(u_dof, v_uv).rgb;
  float d = texture(u_prof, v_uv).r;
  if (u_vista == 1) c = vec3(1.0 - clamp(d / 40.0, 0.0, 1.0));
  if (u_vista == 2) c = vec3(clamp(abs(d - u_foco) / u_rango, 0.0, 1.0), 0.0, 0.0);

  // el ruido solo mete el borde hacia adentro: en el límite del canvas el alfa siempre es 0 y el
  // prado nunca queda cortado por una "pared"
  float n = (snoise(vec3(v_uv * vec2(3.0, 2.0), u_tiempo * 0.02)) * 0.5 + 0.5) * u_ruidoBorde;
  float mx = smoothstep(0.0, u_borde.x, v_uv.x - n) * smoothstep(0.0, u_borde.x, 1.0 - v_uv.x - n);
  float my = smoothstep(0.0, u_borde.y, v_uv.y - n) * smoothstep(0.0, u_borde.y, 1.0 - v_uv.y - n);
  float alfa = mx * my;

  float g = (azar(gl_FragCoord.xy + fract(u_tiempo * 24.0) * 97.0) - 0.5) * u_grano;
  c += g * (1.0 - abs(dot(c, vec3(0.333)) - 0.5) * 1.2);  // más grano en los tonos medios
  o = vec4(c * alfa, alfa);
}
