// Un triángulo que cubre la pantalla; las posiciones salen de gl_VertexID, sin buffers.
export function crearTriangulo(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  return {
    dibujar() {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
    destruir() {
      gl.deleteVertexArray(vao);
    },
  };
}
