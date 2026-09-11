"""Remapea el albedo del modelo a la paleta de la pieza.

El problema: el cel shading necesita separación de zonas —pelo, piel, jersey,
pantalón— o el personaje es una mancha. La textura que trae el modelo generado
tiene las zonas separadas pero con colores turbios que no son los nuestros.

La solución: agrupar los colores del atlas y llevar cada grupo al color de paleta
más cercano, midiendo la distancia en OKLab, que es donde "cercano" significa
lo que el ojo entiende por cercano.
"""

import json
import math
import pathlib
import sys
from collections import Counter

import numpy as np
from PIL import Image

BASE = pathlib.Path(sys.argv[1])
GRUPOS = 10

PALETA = {
    "tinta": "#171717",
    "masa": "#403931",
    "crema-luz": "#f7deae",
    "crema-medio": "#e6c281",
    "crema-sombra": "#aa8d5c",
    "mostaza": "#f4b528",
    "naranja": "#c65b1a",
    "verde": "#288020",
}


def a_lineal(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def a_oklab(rgb):
    """rgb en 0..255, forma (..., 3) -> OKLab."""
    r, g, b = a_lineal(rgb[..., 0]), a_lineal(rgb[..., 1]), a_lineal(rgb[..., 2])
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return np.stack([
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ], axis=-1)


def hex_a_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float64)


src = Image.open(BASE).convert("RGB")
pixeles = np.asarray(src, dtype=np.uint8)

# Agrupar los colores del atlas. Se usa corte de medianas de Pillow: rápido y
# suficiente para una textura que solo necesita quedar separada por zonas.
grupos = src.quantize(colors=GRUPOS, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
pal = grupos.getpalette()[: GRUPOS * 3]
indices = np.asarray(grupos, dtype=np.uint8)
cuenta = Counter(indices.flatten().tolist())
total = indices.size

# La escalera de la paleta, ordenada de oscuro a claro. El atlas del modelo tiene
# un rango tonal muy comprimido —casi todo son grises cálidos— así que llevar cada
# color al MÁS CERCANO colapsa media textura en el mismo marrón. Lo que hace falta
# es estirar: repartir el orden de luminosidad del atlas sobre toda la escalera.
ESCALERA = ["tinta", "masa", "crema-sombra", "crema-medio", "crema-luz"]

# El grupo de más croma se lleva un acento: es la piel, y darle tono propio es lo
# que evita que la cara desaparezca dentro del jersey.
ACENTO = "naranja"

centros = np.array([pal[i * 3:i * 3 + 3] for i in range(GRUPOS)], dtype=np.float64)
labs = a_oklab(centros)
luces = labs[..., 0]
cromas = np.hypot(labs[..., 1], labs[..., 2])

orden = np.argsort(luces)
destino_por_grupo = {}
for puesto, grupo in enumerate(orden):
    escalon = round(puesto * (len(ESCALERA) - 1) / (GRUPOS - 1))
    destino_por_grupo[int(grupo)] = ESCALERA[escalon]

mas_cromatico = int(np.argmax(cromas))
destino_por_grupo[mas_cromatico] = ACENTO

print(f"{'grupo':10} {'L':>6} {'croma':>7} {'%':>7}  ->  destino")
print("-" * 52)

tabla = np.zeros((GRUPOS, 3), dtype=np.uint8)
for i in range(GRUPOS):
    nombre = destino_por_grupo[i]
    tabla[i] = hex_a_rgb(PALETA[nombre]).astype(np.uint8)
    r, g, b = centros[i].astype(int)
    pct = 100 * cuenta.get(i, 0) / total
    marca = "  (acento)" if i == mas_cromatico else ""
    print(f"#{r:02x}{g:02x}{b:02x}  {luces[i]:6.3f} {cromas[i]:7.3f} {pct:6.1f}%  ->  {nombre}{marca}")

def limpiar_zonas(indices, grupos, radio=2, pasadas=1):
    """Consolida las zonas: quita el moteado y desdentella los bordes.

    La cuantización trabaja píxel a píxel y no sabe nada de vecindad, así que
    deja puntos sueltos y bordes deshilachados por toda la textura. En una pieza
    cuyo lenguaje son planos de color con filo limpio, eso se ve como suciedad.

    Se aplica un filtro de MODA, no de mediana: los índices de paleta son
    categorías, no números, y promediarlos no significa nada. Para cada clase se
    difumina su máscara con una caja y luego gana la clase con más presencia en
    el vecindario.

    El radio es pequeño a propósito. Con radio 3 y dos pasadas el moteado baja
    más, pero el filtro se come los detalles pequeños: las pupilas desaparecen y
    los ojos quedan en dos manchas. La cara ocupa poquísimo en el atlas, así que
    un radio en píxeles la castiga mucho más que al jersey.
    """
    from PIL import ImageFilter

    salida = indices
    for _ in range(pasadas):
        presencias = []
        for clase in range(grupos):
            mascara = Image.fromarray(((salida == clase) * 255).astype(np.uint8), "L")
            difusa = mascara.filter(ImageFilter.BoxBlur(radio))
            presencias.append(np.asarray(difusa, dtype=np.uint16))
        salida = np.argmax(np.stack(presencias), axis=0).astype(np.uint8)
    return salida


def moteado(mapa):
    """Porcentaje de pares de vecinos que cambian de zona."""
    cambios = (mapa[1:, :] != mapa[:-1, :]).sum() + (mapa[:, 1:] != mapa[:, :-1]).sum()
    return 100 * cambios / (mapa.shape[0] * mapa.shape[1] * 2)


antes = moteado(indices)
indices = limpiar_zonas(indices, GRUPOS)
print(f"\nmoteado: {antes:.1f}% -> {moteado(indices):.1f}% de vecinos en zona distinta")

remapeado = tabla[indices]
Image.fromarray(remapeado, "RGB").save(BASE, optimize=True)
print(f"\nescrito: {BASE}  ({BASE.stat().st_size / 1024:.0f} KB)")

# el cel shading no usa rugosidad ni normales: quitarlas del material
gltf = BASE.parent / "crudo.gltf"
if gltf.exists():
    doc = json.loads(gltf.read_text())
    for material in doc.get("materials", []):
        pbr = material.get("pbrMetallicRoughness", {})
        pbr.pop("metallicRoughnessTexture", None)
        material.pop("normalTexture", None)
    gltf.write_text(json.dumps(doc))
    print("material: fuera rugosidad y normales")
