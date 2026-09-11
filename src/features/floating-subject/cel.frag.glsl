precision highp float;

varying vec3 vNormal;
varying vec2 vUv;

uniform sampler2D uMapa;
uniform vec3  uBase;        // color plano de paleta
uniform float uUsarTextura; // 0 = color plano, 1 = albedo del modelo posterizado
uniform vec3  uLuz;         // dirección de la luz en espacio de vista
uniform float uNiveles;     // escalones del posterizado del albedo
uniform float uCorteLuz;    // dónde cae el borde entre luz y medio tono
uniform float uCorteSombra;
uniform float uMedio;       // cuánto ilumina la banda intermedia
uniform float uSombra;

/**
 * Cel shading: la iluminación se cuantiza en tres bandas duras. Nada de degradados.
 *
 * `uUsarTextura` va en 0 a propósito. El cel shading NECESITA separación de zonas
 * —pelo, jersey, pantalón— o el personaje es una mancha sin lectura (§3.5), pero
 * la textura que trae este modelo generado es turbia y al posterizarla el jersey
 * sale verde oliva. Hasta que haya modelo bueno, color plano de paleta: se lee
 * limpio y es honesto sobre que el sujeto todavía es un maniquí.
 */
void main() {
  vec3 albedo = uBase;

  if (uUsarTextura > 0.5) {
    vec3 muestra = texture2D(uMapa, vUv).rgb;
    albedo = floor(muestra * uNiveles + 0.5) / uNiveles;
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
