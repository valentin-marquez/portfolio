# Taller

Scripts de la pipeline de assets. No corren en la web: producen lo que la web consume.

## `remapear-paleta.py`

Lleva el albedo de un modelo generado a la paleta de la pieza.

El cel shading necesita **separación de zonas** —pelo, piel, jersey, pantalón— o el
personaje queda como una mancha de un solo tono. Los modelos generados traen las
zonas separadas, pero con colores turbios que no son los nuestros.

El script agrupa los colores del atlas y reparte esos grupos sobre la escalera de
luminosidad de la paleta. **No los lleva al color más cercano**: el atlas tiene un
rango tonal muy comprimido y la cercanía colapsaba seis de diez grupos en el mismo
marrón. Hay que estirar, no acercar. El grupo de más croma se lleva un acento
aparte, que es lo que impide que la cara desaparezca dentro del jersey.

### Receta completa, desde el `.glb` recién generado

```sh
G=/ruta/al/modelo.glb
T=$(mktemp -d)

npx @gltf-transform/cli resize   "$G"        $T/1.glb --width 1024 --height 1024
npx @gltf-transform/cli weld     $T/1.glb    $T/2.glb
npx @gltf-transform/cli simplify $T/2.glb    $T/3.glb --ratio 0.12 --error 0.0005
npx @gltf-transform/cli center   $T/3.glb    $T/4.glb --pivot center
npx @gltf-transform/cli copy     $T/4.glb    $T/crudo.gltf

python3 herramientas/remapear-paleta.py $T/baseColor_1.png

npx @gltf-transform/cli copy  $T/crudo.gltf $T/5.glb
npx @gltf-transform/cli prune $T/5.glb      $T/6.glb
npx @gltf-transform/cli draco $T/6.glb      public/sujeto.glb
```

Medido de punta a punta: **55,8 MB → 597 KB**.

`center --pivot center` es obligatorio. Los modelos generados vienen con el origen
en los pies, y si el sujeto rota así no flota: orbita.

Ojo con una cosa al cargar: el nodo conserva una rotación de 90° en X —la
corrección Z-arriba de Blender— y el desplazamiento del centrado. Quedarse solo
con la geometría de la malla tira las dos y el sujeto sale tumbado.
