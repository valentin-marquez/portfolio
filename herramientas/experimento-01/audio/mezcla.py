#!/usr/bin/env python3
"""Mezcla el tramo de cumbia con los sonidos de UI, cada uno con su pico en el instante del evento, y
deja el loop que usa la página en public/audio/experimento-01.flac.

Correr desde la raíz del repo después de `bun run exp01:eventos`:
    python3 herramientas/experimento-01/audio/mezcla.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np

from sonidos import SR, pico, sonido

AQUI = Path(__file__).resolve().parent.parent
RAIZ = AQUI.parent.parent
REJILLA = json.loads((RAIZ / "src" / "experimentos" / "experimento-01" / "rejilla.json").read_text())
SALIDA = RAIZ / "public" / "audio" / "experimento-01.flac"
MUSICA = 0.92


def main():
    crudo = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(AQUI / "salida" / "tramo.flac"), "-ac", "2", "-ar", str(SR),
         "-f", "f32le", "-"], capture_output=True, check=True).stdout
    musica = np.frombuffer(crudo, np.float32).reshape(-1, 2)
    n = len(musica)
    assert n == REJILLA["muestras"], f"el tramo tiene {n} muestras y deberían ser {REJILLA['muestras']}"

    eventos = json.loads((AQUI / "salida" / "eventos.json").read_text())
    efectos = np.zeros(n)
    errores = []
    teclas = 0
    for ev in eventos:
        indice = teclas if ev["sonido"] == "tecla" else 0
        teclas += ev["sonido"] == "tecla"
        s = sonido(ev["sonido"], indice)
        objetivo = round(ev["t"] * SR)
        inicio = objetivo - pico(s)
        # envuelve: lo que cae antes de 0 o después del final suena al otro lado del loop
        np.add.at(efectos, (inicio + np.arange(len(s))) % n, s)
        errores.append(abs((inicio + pico(s)) - objetivo) / SR * 1000)
    print(f"{len(eventos)} sonidos · error máximo de pico {max(errores):.3f} ms")
    assert max(errores) < 1.0

    mezcla = musica * MUSICA + efectos[:, None]
    tope = np.max(np.abs(mezcla))
    if tope > 0.99:
        mezcla *= 0.99 / tope
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-c:a", "flac", "-sample_fmt", "s16", str(SALIDA)],
                   input=mezcla.astype(np.float32).tobytes(), check=True)
    print(f"→ {SALIDA} (tope {tope:.3f})")


if __name__ == "__main__":
    main()
