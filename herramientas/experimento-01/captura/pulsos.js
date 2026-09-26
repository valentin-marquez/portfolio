// Hoja de contactos del Experimento 01: un cuadro por pulso a 1440×1440 en salida/pulsos/. Se
// corre desde la sesión principal con el Playwright MCP (browser_run_code_unsafe, filename
// "herramientas/experimento-01/captura/pulsos.js"), con el dev server arriba en el 5173.
async (page) => {
  const DESFASE = 0.45; // fracción del pulso en que se toma el cuadro: ahí la acción ya se ve
  const SALIDA = "herramientas/experimento-01/salida/pulsos";
  const antes = page.viewportSize();
  await page.setViewportSize({ width: 1440, height: 1440 });
  await page.goto("http://localhost:5173/experimento-01?captura");
  await page.evaluate(() => window.listo);
  const fuentes = await page.evaluate(
    () =>
      document.fonts.check('500 15px "Geist Sans"') &&
      document.fonts.check('400 11px "Geist Mono"'),
  );
  if (!fuentes)
    throw new Error("Geist no está cargada: las capturas saldrían con la fuente de respaldo");
  const pulso = await page.evaluate(() => window.pulso);
  for (let n = 1; n <= 32; n++) {
    await page.evaluate((t) => window.seek(t), (n - 1 + DESFASE) * pulso);
    await page.screenshot({ path: `${SALIDA}/${String(n).padStart(2, "0")}.png` });
  }
  await page.setViewportSize(antes ?? { width: 1440, height: 900 });
  return `32 cuadros en ${SALIDA}`;
}
