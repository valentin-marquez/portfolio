// La página /experimento-01. Por ahora solo valida el formulario; la transformación llega después.
import "./formulario.css";
import { escalaTarjeta } from "./medidas";

const formulario = document.querySelector<HTMLFormElement>("form.pedido");
const registro = document.querySelector<HTMLElement>("#registro");
if (!formulario || !registro) throw new Error("falta el formulario en experimento-01.html");

function ajustarTarjeta() {
  if (!formulario || !registro) return;
  const alto =
    formulario.offsetHeight + (registro.querySelector<HTMLElement>(".cinta")?.offsetHeight ?? 0);
  registro.style.setProperty("--escala", String(escalaTarjeta(480, alto, innerWidth, innerHeight)));
}

// la tarjeta de gracias mide lo mismo que el formulario (con las fuentes ya cargadas)
document.fonts.ready.then(() => {
  registro.style.setProperty("--alto-tarjeta", `${formulario.getBoundingClientRect().height}px`);
  ajustarTarjeta();
});
addEventListener("resize", ajustarTarjeta);

formulario.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!formulario.reportValidity()) return;
});
