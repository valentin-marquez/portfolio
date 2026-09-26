// Revisión automática: en un instante tranquilo de cada estado, ningún texto o ícono visible se sale
// de la forma (con 4 px de margen) y ningún texto mide menos de 26 px en el cuadro de 1440. Se corre
// con el Playwright MCP como pulsos.js; devuelve la lista de problemas (vacía si no hay).
async (page) => {
  const antes = page.viewportSize();
  await page.setViewportSize({ width: 1440, height: 1440 });
  await page.goto("http://localhost:5173/experimento-01?captura");
  await page.evaluate(() => window.listo);
  const momentos = await page.evaluate(() => window.revision);
  const problemas = [];
  for (const { estado, t } of momentos) {
    await page.evaluate((x) => window.seek(x), t);
    const hallazgos = await page.evaluate(
      ({ t, MARGEN, TEXTO_MINIMO }) => {
        const caja = window.cajaEnPantalla(t);
        const salida = [];
        for (const grupo of document.querySelectorAll(".escena-01 .mundo > .grupo")) {
          if (Number(getComputedStyle(grupo).opacity) < 0.5) continue;
          for (const el of grupo.children) {
            const estilo = getComputedStyle(el);
            if (Number(estilo.opacity) < 0.5 || estilo.display === "none") continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            const nombre = `${el.className?.baseVal ?? el.className} «${(el.textContent ?? "").slice(0, 24)}»`;
            const fuera =
              r.left < caja.x + MARGEN ||
              r.top < caja.y + MARGEN ||
              r.right > caja.x + caja.w - MARGEN ||
              r.bottom > caja.y + caja.h - MARGEN;
            if (fuera) salida.push(`se sale: ${nombre}`);
            if ((el.textContent ?? "").trim()) {
              // alto en pantalla / alto de layout = el zoom acumulado de la cámara y del grupo
              const px = Number.parseFloat(estilo.fontSize) * (r.height / el.offsetHeight || 1);
              if (px < TEXTO_MINIMO) salida.push(`texto chico (${px.toFixed(1)} px): ${nombre}`);
            }
          }
        }
        return salida;
      },
      { t, MARGEN: 4, TEXTO_MINIMO: 26 },
    );
    for (const h of hallazgos) problemas.push(`${estado} (${t.toFixed(2)} s): ${h}`);
  }
  await page.setViewportSize(antes ?? { width: 1440, height: 900 });
  return { estados: momentos.length, problemas };
}
