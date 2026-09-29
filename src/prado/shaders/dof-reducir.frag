// Profundidad de campo barata (teléfonos), paso 1: la escena a media resolución. El filtro lineal
// promedia cuatro píxeles de una vez; en alfa va cuánto debe desenfocarse cada punto, con signo:
// negativo lo que está más cerca que el foco, positivo lo que está más lejos, 0 lo nítido.
in vec2 v_uv;

uniform sampler2D u_color;
uniform sampler2D u_prof;
uniform float u_foco;
uniform float u_rango;

out vec4 o;

void main() {
  float d = texture(u_prof, v_uv).r;
  o = vec4(texture(u_color, v_uv).rgb, clamp((d - u_foco) / u_rango, -1.0, 1.0));
}
