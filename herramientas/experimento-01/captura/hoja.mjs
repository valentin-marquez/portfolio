// Arma la hoja de contactos (8×4) y un visor a pantalla completa (← →) con los cuadros que deja
// pulsos.js. Solo node y ffmpeg.
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const SALIDA = new URL("../salida/pulsos/", import.meta.url);

execFileSync("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-start_number",
  "1",
  "-i",
  new URL("%02d.png", SALIDA).pathname,
  "-vf",
  "scale=360:360,tile=8x4",
  "-frames:v",
  "1",
  new URL("hoja.png", SALIDA).pathname,
]);

const visor = `<!doctype html><meta charset="utf-8"><title>Pulsos</title>
<style>html,body{margin:0;background:#1a1a18;color:#ddd;font:14px system-ui}img{display:block;height:100vh;margin:0 auto}p{position:fixed;left:16px;top:12px;margin:0}</style>
<p id="n"></p><img id="i" alt="">
<script>let n=1;const f=()=>{i.src=String(n).padStart(2,"0")+".png";document.getElementById("n").textContent="pulso "+n+" / 32   ← →"};addEventListener("keydown",e=>{if(e.key==="ArrowRight")n=n%32+1;if(e.key==="ArrowLeft")n=(n+30)%32+1;f()});f()</script>`;
await writeFile(new URL("visor.html", SALIDA), visor);
console.log(`listo: ${new URL("visor.html", SALIDA).pathname}`);
