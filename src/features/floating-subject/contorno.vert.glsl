uniform float uGrosor;

void main() {
  // casco invertido: la malla se infla a lo largo de sus normales y se pinta de
  // tinta por la cara de atrás. Es el contorno del anime, y le da igual lo
  // grumosa que sea la topología de un modelo generado por IA — un detector de
  // bordes sobre estas normales dibujaría líneas por toda la superficie.
  vec3 inflado = position + normal * uGrosor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(inflado, 1.0);
}
