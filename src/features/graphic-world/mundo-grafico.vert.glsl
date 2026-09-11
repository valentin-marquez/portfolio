void main() {
  // ScreenQuad ya entrega el triángulo en espacio de recorte: se pasa tal cual
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
