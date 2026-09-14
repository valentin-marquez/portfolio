uniform sampler2D uFrameActual;
uniform sampler2D uFrameSiguiente;
uniform float uMezcla;

varying vec2 vUv;

void main() {
  vec4 actual = texture2D(uFrameActual, vUv);
  vec4 siguiente = texture2D(uFrameSiguiente, vUv);
  gl_FragColor = mix(actual, siguiente, uMezcla);
}
