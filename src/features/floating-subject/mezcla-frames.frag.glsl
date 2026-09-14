uniform sampler2D uFrameActual;
uniform sampler2D uFrameSiguiente;
uniform float uMezcla;

varying vec2 vUv;

void main() {
  vec4 actual = texture2D(uFrameActual, vUv);
  vec4 siguiente = texture2D(uFrameSiguiente, vUv);
  actual.rgb *= actual.a;
  siguiente.rgb *= siguiente.a;
  vec4 color = mix(actual, siguiente, uMezcla);
  if (color.a < 0.01) discard;
  gl_FragColor = color;
}
