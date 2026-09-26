#!/usr/bin/env python3
"""Mide la rejilla de pulsos de «Cumbia B» (KAIRONVOSS, Pixabay) y corta el tramo del experimento.

Correr desde la raíz del repo:  python3 herramientas/experimento-01/audio/rejilla.py
Escribe src/experimentos/experimento-01/rejilla.json, herramientas/experimento-01/salida/tramo.flac y
una copia del tramo (solo música) en public/audio/experimento-01.flac.
"""
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent.parent
RAIZ = AQUI.parent.parent
FUENTE = AQUI / "salida" / "cumbia-b.mp3"
TRAMO = AQUI / "salida" / "tramo.flac"
REJILLA = RAIZ / "src" / "experimentos" / "experimento-01" / "rejilla.json"
PUBLICO = RAIZ / "public" / "audio" / "experimento-01.flac"
URL = ("https://cdn.pixabay.com/download/audio/2025/12/12/audio_d015a15077.mp3"
       "?filename=kaironvoss-cumbia-b-446534.mp3")
SR = 22050
N, H = 2048, 256
PULSO_INICIO = 130  # el golpe con que la cumbia vuelve del quiebre (1:22.1)
PULSOS = 32
SR_SALIDA = 48000


def decodificar(ruta: Path, sr: int) -> np.ndarray:
    crudo = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(ruta), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(crudo, np.float32)


def espectro(y: np.ndarray):
    n = 1 + (len(y) - N) // H
    idx = np.arange(N)[None, :] + H * np.arange(n)[:, None]
    S = np.abs(np.fft.rfft(y[idx] * np.hanning(N), axis=1))
    t = np.arange(n) * H / SR + N / 2 / SR
    return t, S


def flujo(S: np.ndarray) -> np.ndarray:
    """flujo espectral positivo en escala log, sin la tendencia lenta"""
    L = np.log1p(100 * S)
    d = np.maximum(0, np.diff(L, axis=0)).sum(1)
    d = np.concatenate([[0], d])
    d = d - np.convolve(d, np.ones(16) / 16, "same")
    return np.maximum(d, 0)


def puntaje(t, o, fase, p, dur):
    return np.interp(np.arange(fase, dur - 0.1, p), t, o).mean()


def ajustar(t, o, dur):
    """barre tempo y fase y se queda con la rejilla que más onsets pisa"""
    mejor = (0.0, 0.0, 0.0)
    for bpm in np.arange(94, 98.001, 0.005):
        p = 60 / bpm
        for fase in np.linspace(0, p, 64, endpoint=False):
            s = puntaje(t, o, fase, p, dur)
            if s > mejor[0]:
                mejor = (s, bpm, fase)
    _, bpm, fase = mejor
    p = 60 / bpm
    finas = np.linspace(fase - p / 64, fase + p / 64, 65)
    fase = finas[int(np.argmax([puntaje(t, o, x, p, dur) for x in finas]))]
    return float(bpm), float(fase)


def fraccion_graves(y, inicio, largo):
    seg = y[int(inicio * SR):int((inicio + largo) * SR)]
    S = np.abs(np.fft.rfft(seg))
    f = np.fft.rfftfreq(len(seg), 1 / SR)
    return S[f < 150].sum() / S.sum()


def desvios(t, o, rejilla):
    """cuánto se corre el onset más fuerte de cada pulso respecto de la rejilla (s)"""
    salida = []
    for x in rejilla:
        v = (t > x - 0.06) & (t < x + 0.06)
        if v.any():
            salida.append(t[v][np.argmax(o[v])] - x)
    return np.array(salida)


def main():
    if not FUENTE.exists():
        FUENTE.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["curl", "-sfL", "-A", "Mozilla/5.0", "-o", str(FUENTE), URL], check=True)

    y = decodificar(FUENTE, SR)
    dur = len(y) / SR
    t, S = espectro(y)
    o = flujo(S)
    bpm, fase = ajustar(t, o, dur)
    p = 60 / bpm
    pulsos = np.arange(fase, dur, p)
    print(f"tempo {bpm:.3f} BPM · pulso {p * 1000:.2f} ms · fase {fase * 1000:.1f} ms")

    # el quiebre: el bajo desaparece en los pulsos 124, 125, 128 y 129 y vuelve entero en el 130
    quiebre = np.mean([fraccion_graves(y, pulsos[i], p) for i in (124, 125, 128, 129)])
    vuelta = np.mean([fraccion_graves(y, pulsos[i], p) for i in range(130, 134)])
    print(f"graves en el quiebre {quiebre:.3f} → al volver {vuelta:.3f}")
    assert vuelta > 5 * quiebre, "no encuentro el quiebre: la rejilla no calza con la canción"

    t0 = float(pulsos[PULSO_INICIO] + desvios(t, o, pulsos[PULSO_INICIO:PULSO_INICIO + PULSOS]).mean())
    muestras = round(PULSOS * p * SR_SALIDA)
    TRAMO.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.6f}", "-t", f"{PULSOS * p + 0.5:.6f}", "-i", str(FUENTE),
        "-af", f"aresample={SR_SALIDA},atrim=end_sample={muestras}",
        "-ac", "2", "-sample_fmt", "s16", str(TRAMO)], check=True)

    # comprobaciones: el tramo dura lo justo y sus onsets caen en la rejilla
    n = len(decodificar(TRAMO, SR_SALIDA))
    assert n == muestras, f"el tramo tiene {n} muestras y deberían ser {muestras}"
    duracion = muestras / SR_SALIDA
    t2, S2 = espectro(decodificar(TRAMO, SR))
    d = desvios(t2, flujo(S2), np.arange(PULSOS) * (duracion / PULSOS)) * 1000
    print(f"desvío en el tramo: media {d.mean():.1f} ms · mediana |d| {np.median(np.abs(d)):.1f} ms")
    assert abs(d.mean()) < 15 and np.median(np.abs(d)) < 25, "el tramo quedó fuera de la rejilla"

    PUBLICO.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(TRAMO, PUBLICO)
    datos = {
        "cancion": "Cumbia B — KAIRONVOSS (Pixabay, licencia de contenido de Pixabay)",
        "bpm": round(bpm, 4),
        "pulso": round(p, 7),
        "t0": round(t0, 4),
        "duracionCancion": round(dur, 3),
        "pulsos": PULSOS,
        "frecuencia": SR_SALIDA,
        "muestras": muestras,
    }
    REJILLA.parent.mkdir(parents=True, exist_ok=True)
    REJILLA.write_text(json.dumps(datos, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(datos, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
