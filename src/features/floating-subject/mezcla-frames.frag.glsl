uniform sampler2D uFrameActual;
uniform sampler2D uFrameSiguiente;
uniform sampler2D uFlujo;
uniform float uMezcla;
uniform float uEscalaFlujo;
uniform float uDensidadTrama;
uniform float uAnguloTrama;
uniform vec2 uResolucion;
uniform int uModo;

varying vec2 vUv;

/* Distancia al centro del punto de trama más cercano, normalizada a 0..1. */
float trama(vec2 punto) {
  float a = radians(uAnguloTrama);
  mat2 giro = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 celda = fract(giro * punto * uDensidadTrama) - 0.5;
  return clamp(length(celda) * 1.41421356, 0.0, 1.0);
}

void main() {
  vec2 uvA = vUv;
  vec2 uvB = vUv;

  if (uModo == 2) {
    // el mapa guarda en 0..1 el desplazamiento del frame actual al siguiente;
    // aquí vuelve a -1..1. Se muestrea HACIA ATRÁS: el punto que en el morph
    // está en vUv viene de vUv - d·t en el frame actual, y de vUv + d·(1-t) en
    // el siguiente. Con el signo al revés las poses se separan en vez de juntarse.
    vec2 desplazamiento = (texture2D(uFlujo, vUv).rg * 2.0 - 1.0) * uEscalaFlujo;
    uvA = vUv - desplazamiento * uMezcla;
    uvB = vUv + desplazamiento * (1.0 - uMezcla);
  }

  vec4 actual = texture2D(uFrameActual, uvA);
  vec4 siguiente = texture2D(uFrameSiguiente, uvB);
  actual.rgb *= actual.a;
  siguiente.rgb *= siguiente.a;

  vec4 color;
  if (uModo == 0) {
    color = uMezcla < 0.5 ? actual : siguiente;
  } else if (uModo == 1) {
    // cada píxel es entero de un frame o del otro, nunca medio de cada: por eso
    // no hay fantasma de doble exposición, que es lo que arruina el fundido
    color = trama(gl_FragCoord.xy / uResolucion.y) < uMezcla ? siguiente : actual;
  } else {
    color = mix(actual, siguiente, uMezcla);
  }

  if (color.a < 0.01) discard;
  gl_FragColor = color;
}
