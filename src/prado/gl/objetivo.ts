// Objetivos de render. La escena escribe dos salidas a la vez (MRT): color y profundidad lineal en
// metros, ambas RGBA16F. Con MSAA se dibuja en renderbuffers multisample y se resuelve con blit.

function texturaFlotante(gl: WebGL2RenderingContext, ancho: number, alto: number, t: WebGLTexture) {
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, ancho, alto, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function comprobar(gl: WebGL2RenderingContext) {
  const estado = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (estado !== gl.FRAMEBUFFER_COMPLETE && !gl.isContextLost()) {
    throw new Error(`framebuffer incompleto: 0x${estado.toString(16)}`);
  }
}

function crear<T>(v: T | null, que: string): T {
  if (!v) throw new Error(`no se pudo crear ${que}`);
  return v;
}

export interface ObjetivoEscena {
  readonly texColor: WebGLTexture;
  readonly texProf: WebGLTexture;
  usar(): void;
  resolver(): void;
  redimensionar(ancho: number, alto: number): void;
  destruir(): void;
}

export function crearObjetivoEscena(
  gl: WebGL2RenderingContext,
  muestrasPedidas: number,
): ObjetivoEscena {
  const muestras = Math.min(muestrasPedidas, gl.getParameter(gl.MAX_SAMPLES) as number);
  const texColor = crear(gl.createTexture(), "la textura de color");
  const texProf = crear(gl.createTexture(), "la textura de profundidad");
  const fbResuelto = crear(gl.createFramebuffer(), "el framebuffer");
  const fbMsaa = muestras > 0 ? crear(gl.createFramebuffer(), "el framebuffer MSAA") : null;
  const rbColor = muestras > 0 ? gl.createRenderbuffer() : null;
  const rbProf = muestras > 0 ? gl.createRenderbuffer() : null;
  const rbDepth = crear(gl.createRenderbuffer(), "el buffer de profundidad");
  let ancho = 0;
  let alto = 0;

  function asignar() {
    texturaFlotante(gl, ancho, alto, texColor);
    texturaFlotante(gl, ancho, alto, texProf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbResuelto);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texColor, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, texProf, 0);
    if (fbMsaa) {
      comprobar(gl);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rbColor);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, muestras, gl.RGBA16F, ancho, alto);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rbProf);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, muestras, gl.RGBA16F, ancho, alto);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rbDepth);
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        muestras,
        gl.DEPTH_COMPONENT24,
        ancho,
        alto,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbMsaa);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rbColor);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.RENDERBUFFER, rbProf);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbDepth);
    } else {
      gl.bindRenderbuffer(gl.RENDERBUFFER, rbDepth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, ancho, alto);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbDepth);
    }
    comprobar(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  return {
    texColor,
    texProf,
    usar() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbMsaa ?? fbResuelto);
      gl.viewport(0, 0, ancho, alto);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    },
    resolver() {
      if (!fbMsaa) return;
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbMsaa);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fbResuelto);
      for (let i = 0; i < 2; i++) {
        gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
        gl.drawBuffers(i === 0 ? [gl.COLOR_ATTACHMENT0, gl.NONE] : [gl.NONE, gl.COLOR_ATTACHMENT1]);
        gl.blitFramebuffer(0, 0, ancho, alto, 0, 0, ancho, alto, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      }
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    },
    redimensionar(a, b) {
      const nuevoAncho = Math.max(1, a);
      const nuevoAlto = Math.max(1, b);
      if (nuevoAncho === ancho && nuevoAlto === alto) return;
      ancho = nuevoAncho;
      alto = nuevoAlto;
      try {
        asignar();
      } catch (error) {
        // sin tamaño guardado, el próximo intento vuelve a asignar en vez de dibujar a medias
        ancho = 0;
        alto = 0;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        throw error;
      }
    },
    destruir() {
      gl.deleteTexture(texColor);
      gl.deleteTexture(texProf);
      gl.deleteFramebuffer(fbResuelto);
      if (fbMsaa) gl.deleteFramebuffer(fbMsaa);
      gl.deleteRenderbuffer(rbColor);
      gl.deleteRenderbuffer(rbProf);
      gl.deleteRenderbuffer(rbDepth);
    },
  };
}

export interface ObjetivoSimple {
  readonly tex: WebGLTexture;
  usar(): void;
  redimensionar(ancho: number, alto: number): void;
  destruir(): void;
}

/** Una sola salida RGBA16F, para pasadas de pantalla completa como la profundidad de campo. */
export function crearObjetivoSimple(gl: WebGL2RenderingContext): ObjetivoSimple {
  const tex = crear(gl.createTexture(), "la textura");
  const fb = crear(gl.createFramebuffer(), "el framebuffer");
  let ancho = 0;
  let alto = 0;
  return {
    tex,
    usar() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, ancho, alto);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    },
    redimensionar(a, b) {
      const nuevoAncho = Math.max(1, a);
      const nuevoAlto = Math.max(1, b);
      if (nuevoAncho === ancho && nuevoAlto === alto) return;
      texturaFlotante(gl, nuevoAncho, nuevoAlto, tex);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      try {
        comprobar(gl);
      } finally {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      ancho = nuevoAncho;
      alto = nuevoAlto;
    },
    destruir() {
      gl.deleteTexture(tex);
      gl.deleteFramebuffer(fb);
    },
  };
}
