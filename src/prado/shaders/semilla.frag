// Semilla de diente de león: vilano en abanico (hebras con puntas claras), pico y aquenio pardos.
// El desenfoque ensancha los bordes y baja la opacidad, como una semilla fuera de foco.
in vec2 v_q;
in float v_alfa;
in float v_des;

out vec4 o;

void main() {
  vec2 q = v_q;
  float blando = 0.02 + v_des * 0.25;
  vec2 d = q - vec2(0.0, 0.15);  // donde nace el vilano
  float r = length(d);
  float a = atan(d.x, d.y);  // 0 hacia arriba
  float abanico = smoothstep(1.35 + blando, 1.2 - blando, abs(a));
  float hebra = smoothstep(0.18 + blando * 2.0, 0.0, abs(fract(a * 7.0 + 0.5) - 0.5))
              * abanico * smoothstep(0.85 + blando, 0.2, r) * smoothstep(0.0, 0.08, r);
  float puntas = smoothstep(0.12 + blando, 0.0, abs(r - 0.78)) * abanico * 0.8;
  float pico = smoothstep(0.03 + blando, 0.0, abs(q.x)) * step(-0.75, q.y) * step(q.y, 0.15);
  float aquenio = smoothstep(0.1 + blando, 0.0, length((q - vec2(0.0, -0.82)) * vec2(3.0, 1.2)));
  float blanco = max(hebra * 0.7, puntas);
  float pardo = max(pico * 0.6, aquenio);
  // gris cálido y no blanco: sobre el crema de la página un vilano blanco desaparece
  vec3 vilano = mix(vec3(0.7, 0.68, 0.62), vec3(0.86, 0.84, 0.79), puntas);
  vec3 c = mix(vilano, vec3(0.5, 0.41, 0.31), pardo / max(blanco + pardo, 1e-3));
  float alfa = clamp(blanco + pardo, 0.0, 1.0) * v_alfa * (1.0 - v_des * 0.5);
  o = vec4(c * alfa, alfa);
}
