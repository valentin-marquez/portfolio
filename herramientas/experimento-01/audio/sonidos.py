#!/usr/bin/env python3
"""Sonidos de UI sintetizados con numpy: cortos, secos y bajos respecto de la música.

Correr solo (desde la raíz del repo) para escucharlos:
    python3 herramientas/experimento-01/audio/sonidos.py
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 48000


def _t(ms):
    return np.arange(int(SR * ms / 1000)) / SR


def _clic(tono, cuerpo, ganancia, semilla):
    t = _t(45)
    ruido = np.random.default_rng(semilla).standard_normal(len(t))
    ruido = np.diff(ruido, prepend=0.0) * np.exp(-t / 0.0015)  # la derivada deja solo el agudo
    ping = np.sin(2 * np.pi * tono * t) * np.exp(-t / 0.005)
    golpe = np.sin(2 * np.pi * cuerpo * t) * np.exp(-t / 0.012)
    return ganancia * (0.25 * ruido + 0.35 * ping + 0.5 * golpe)


def _nota(frecuencia, ms, caida):
    t = _t(ms)
    ataque = np.minimum(1, t / 0.003)
    return np.sin(2 * np.pi * frecuencia * t) * ataque * np.exp(-t / caida)


def _junto(*partes):
    """suma partes (desfase_ms, señal) en un solo arreglo"""
    largo = max(int(SR * d / 1000) + len(s) for d, s in partes)
    salida = np.zeros(largo)
    for d, s in partes:
        i = int(SR * d / 1000)
        salida[i:i + len(s)] += s
    return salida


def sonido(nombre: str, indice: int = 0) -> np.ndarray:
    if nombre == "clic":
        s = _clic(3800, 170, 1.0, 1)
    elif nombre == "interruptor":
        s = _junto((0, _clic(4200, 190, 1.0, 2)), (55, _clic(3000, 150, 0.7, 3)))
    elif nombre == "agarre":
        s = _clic(2400, 140, 0.6, 4)
    elif nombre == "tecla":
        s = _clic(3300 + 250 * (indice * 7 % 5), 120, 0.55, 10 + indice)
    elif nombre == "enter":
        s = _clic(2600, 110, 0.9, 5)
    elif nombre == "exito":
        s = _junto((0, 0.5 * _nota(1318.5, 260, 0.16)), (70, 0.45 * _nota(1975.5, 300, 0.18)))
    elif nombre == "pop":
        t = _t(90)
        f = 880 - 360 * np.minimum(1, t / 0.045)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.002) * np.exp(-t / 0.04)
    else:
        raise ValueError(f"sonido desconocido: {nombre}")
    return (0.3 * s / np.max(np.abs(s))).astype(np.float32)


def pico(x: np.ndarray) -> int:
    """muestra del pico de la envolvente (|x| promediado en 1 ms)"""
    return int(np.argmax(np.convolve(np.abs(x), np.ones(48) / 48, "same")))


if __name__ == "__main__":
    carpeta = Path(__file__).resolve().parent.parent / "salida" / "sonidos"
    carpeta.mkdir(parents=True, exist_ok=True)
    for nombre in ["clic", "interruptor", "agarre", "tecla", "enter", "exito", "pop"]:
        s = sonido(nombre)
        ruta = carpeta / f"{nombre}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        str(ruta)], input=s.tobytes(), check=True)
        print(f"{nombre:12s} {len(s) / SR * 1000:6.1f} ms · pico en {pico(s) / SR * 1000:5.1f} ms → {ruta}")
