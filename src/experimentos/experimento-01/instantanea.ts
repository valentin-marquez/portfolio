// Tarjeta DOM → canvas: se serializa dentro de un foreignObject de SVG con el CSS de la página y las
// fuentes incrustadas, y se dibuja en un canvas que después es la textura de three.js.
// ponytail: foreignObject propio; si Safari la dibuja mal (fuentes o primer cuadro en blanco),
// cambiar a modern-screenshot.

export function svgDe(html: string, css: string, ancho: number, alto: number): string {
  const cdata = css.replaceAll("]]>", "]]]]><![CDATA[>");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><foreignObject x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style><![CDATA[${cdata}]]></style>${html}</div></foreignObject></svg>`;
}

/** el estado de los controles viaja como atributos: el HTML serializado no guarda value ni checked */
export function fijarEstado(raiz: HTMLElement) {
  for (const i of raiz.querySelectorAll("input")) {
    if (i.type === "checkbox" || i.type === "radio") i.toggleAttribute("checked", i.checked);
    else i.setAttribute("value", i.value);
  }
}

async function aDataUrl(url: string): Promise<string> {
  const b = await (await fetch(url)).blob();
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => mal(r.error);
    r.readAsDataURL(b);
  });
}

/** las fuentes que la página usa de verdad: el subconjunto latino básico (no latin-ext ni otros
 alfabetos, que pesan cientos de KB y nunca se bajan en una página en inglés) */
export function urlsDeFuentes(css: string): string[] {
  return [...new Set(css.match(/url\(["']?[^"')]+-latin-\d+-normal[^"')]*\.woff2["']?\)/g) ?? [])];
}

/** el CSS de la página con las fuentes woff2 y las imágenes incrustadas: dentro de un SVG no se baja nada */
export async function leerCss(): Promise<string> {
  let css = "";
  for (const hoja of document.styleSheets) {
    try {
      for (const regla of hoja.cssRules) css += `${regla.cssText}\n`;
    } catch {
      // hojas de otro origen: esta página no tiene
    }
  }
  const urls = urlsDeFuentes(css);
  const datos = await Promise.all(
    urls.map((u) => aDataUrl(new URL(u.slice(4, -1).replace(/["']/g, ""), location.href).href)),
  );
  urls.forEach((u, i) => {
    css = css.replaceAll(u, `url("${datos[i]}")`);
  });
  return css;
}

/** las imágenes del clon (la amapola del casillero) también van incrustadas */
export async function incrustarImagenes(raiz: HTMLElement) {
  for (const img of raiz.querySelectorAll("img")) img.setAttribute("src", await aDataUrl(img.src));
}

export async function instantanea(
  el: HTMLElement,
  css: string,
  escala: number,
): Promise<HTMLCanvasElement> {
  // tamaño de layout (sin la escala de la tarjeta en pantallas chicas)
  const ancho = el.offsetWidth;
  const alto = el.offsetHeight;
  const html = new XMLSerializer().serializeToString(el);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDe(html, css, ancho, alto))}`;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = Math.round(ancho * escala);
  c.height = Math.round(alto * escala);
  const x = c.getContext("2d");
  if (!x) throw new Error("sin contexto 2D para la instantánea");
  x.scale(escala, escala);
  x.drawImage(img, 0, 0, ancho, alto);
  return c;
}
