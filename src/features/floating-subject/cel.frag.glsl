precision highp float;

varying vec3 vNormal;
varying vec2 vUv;

uniform sampler2D uMapa;
uniform vec3  uBase;        // color plano de paleta
uniform float uUsarTextura; // 0 = color plano, 1 = albedo ya remapeado a paleta
uniform vec3  uLuz;         // dirección de la luz en espacio de vista
uniform float uCorteLuz;    // dónde cae el borde entre luz y medio tono
uniform float uCorteSombra;
uniform float uMedio;       // cuánto ilumina la banda intermedia
uniform float uSombra;

/**
 * Cel shading: la iluminación se cuantiza en tres bandas duras. Nada de degradados.
 *
 * El albedo NO se posteriza aquí. La textura llega ya remapeada a la paleta desde
 * el taller (`remapear-paleta.py`): cuantizarla otra vez la sacaría de la paleta,
 * que es justo lo que no queremos.
 *
 * El cel shading necesita esa separación de zonas —pelo, piel, jersey, pantalón—
 * o el personaje es una mancha sin lectura (§3.5).
 */
void main() {
  vec3 albedo = uBase;

  if (uUsarTextura > 0.5) {
    albedo = texture2D(uMapa, vUv).rgb;
  }

  float incidencia = dot(normalize(vNormal), normalize(uLuz));

  float banda = uSombra;
  if (incidencia > uCorteLuz) {
    banda = 1.0;
  } else if (incidencia > uCorteSombra) {
    banda = uMedio;
  }

  gl_FragColor = vec4(albedo * banda, 1.0);
}
