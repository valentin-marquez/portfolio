# El sujeto pasa a frames 2D — diseño

**Fecha:** 2026-09-14
**Estado:** cerrado, listo para plan de implementación.
**Relación con el diseño anterior:** este documento **sustituye** las partes de
`2026-09-11-pieza-3d-grafica-design.md` que hablan del sujeto como malla 3D
real-time (§2.3, §3 completo, §4.1 en lo referente a Hunyuan3D/Blender, §4.3,
§6, y añade entradas a §8). Todo lo demás de aquel documento — dirección
visual (§2.0, §2.1, §2.2), tipografía (§2.4), sonido (§2.5), arquitectura por
features (§4.2), amortiguación del scroll (§4.4), anclas con nombre (§4.5),
rendimiento (§5) y las decisiones abiertas (§7) — **sigue vigente sin
cambios**.

---

## 0. Por qué este cambio

El 3D real-time (reconstrucción con Hunyuan3D, rig, cel shading en Three.js)
resultó bastante más difícil de lo que el presupuesto de tiempo del proyecto
aguanta bien. La dirección gráfica ya la definía una imagen 2D (la key art,
§2.0 del diseño anterior) — tiene más sentido iterar directamente sobre eso
con generación/edición de imagen que seguir peleando una reconstrucción 3D
cuyo único aporte real era la cámara moviéndose alrededor de una malla.

**Lo que no cambia de fondo:** el sujeto sigue viviendo en el mundo 3D, en la
posición de la ancla activa, ocluyendo la tipografía por profundidad. Lo que
cambia es **cómo se genera el píxel** — arte 2D pre-generado en vez de
geometría sombreada en tiempo real — y que ahora el scroll anima directamente
el sujeto, no solo la cámara.

**Se elimina, no se congela:** todo el trabajo de Hunyuan3D/Blender. No es una
dirección a la que se planee volver.

---

## 1. Pipeline de assets — krea.ai

Punto de partida: `docs/referencias/direccion-visual-key-art.png` (la misma
referencia que ya fijaba la dirección visual). Con **Krea 2**:

1. **Aislar la figura.** Edición generativa (Nano Banana / Flux Kontext /
   Qwen, los modelos de edición que trae Krea) sobre la key art: quitar el
   fondo urbano — postes, tendido, edificios — y dejar solo el personaje con
   fondo transparente.
2. **Generar el character sheet.** Con la figura aislada como referencia de
   identidad, pedir el turnaround de ángulos (y grid de expresión si hace
   falta más adelante) que cubra las anclas de cámara existentes: `lejos`,
   `cuerpo`, `hombro`, `cara`. Krea 2 está pensado justo para esto — mantiene
   el mismo personaje entre variaciones a partir de un prompt por imagen.
3. **Salida:** PNGs con fondo transparente, un puñado de frames por ancla
   (el turnaround), que entran directos a `public/sujeto/`.

**Nada de trabajo intermedio entra al repo** — mismo principio que regía el
pipeline anterior (§3.4 del diseño de origen). Solo llegan los PNG finales,
ya recortados y del tamaño que se vaya a usar.

**Convención de nombre:** `public/sujeto/<ancla>-<indice>.png` — plano,
ordenable, sin sorpresas (`lejos-0.png`, `lejos-1.png`, `cuerpo-0.png`...).

---

## 2. Cómo vive el sujeto en la escena

`floating-subject` monta un **plano** (`THREE.PlaneGeometry` +
`ShaderMaterial`, ver §3) en la posición 3D de la ancla activa. El sistema de
anclas nombradas de `camera-cuts` no cambia — el plano se coloca donde antes
se colocaba el origen del `.glb`.

**Selección de frame atada al scroll continuo, no al índice de encuadre.**
Cada ancla no es una imagen suelta: es un grupo de frames (el turnaround de
esa parada). El progreso de scroll dentro del tramo hacia esa ancla decide
qué frame, o qué mezcla entre dos frames contiguos, se muestra — el
personaje da la sensación de girar o cambiar de gesto mientras se scrollea, y
se asienta en una pose concreta al llegar a la parada. Reutiliza
`progreso-scroll.ts`, que ya da ese 0-1 continuo; el índice entero de
`use-indice-encuadre.ts` sigue decidiendo la ancla, pero ya no es lo único
que lee el sujeto.

**Corrección a los tres relojes (§4.3 del diseño de origen):** el sujeto
dejaba de tener "su propio tiempo, continuo, indiferente al visitante".
Ahora depende del scroll igual que la cámara. El modelo pasa de tres relojes
a dos:

| Reloj | Quién lo mueve | Carácter |
|---|---|---|
| **Cámara + sujeto** | el scroll del visitante | por encaje, seco, con muelle tenso; el sujeto gira/gesticula en el tramo y se asienta en la parada |
| **La capa gráfica** | los cortes de cámara | a golpe, sincronizado |

---

## 3. El shader de mezcla

Reemplaza a `cel.*.glsl` y `contorno.*.glsl`. Cada frame ya trae el
cel-shading horneado — viene del mismo estilo que la key art, con su propio
contorno de tinta — así que no hace falta rampa de tonos ni casco invertido
en tiempo real.

`mezcla-frames.vert.glsl` / `mezcla-frames.frag.glsl`: dos texturas
(`frameActual`, `frameSiguiente`) y un uniform `mezcla` (0-1) que hace el
cruce. Ese uniform lo mueve `cuadros-por-progreso.ts` mientras hay scroll
dentro de un tramo, y GSAP para el asentamiento final al llegar a la
parada — mismo criterio que ya usa `muelle-tenso.ts` para la cámara: corto,
con sobreimpulso mínimo, nunca blando.

---

## 4. Lógica nueva y testeable

`cuadros-por-progreso.ts` — función pura:

```
(ancla, progreso 0-1) → { frameActual, frameSiguiente, mezcla }
```

Es la única lógica nueva de este cambio que vale la pena testear — mismo
criterio que ya rige el proyecto (§4.6 del diseño de origen: los píxeles no
se testean, la matemática sí). Se testea igual que `progreso-scroll.test.ts`
y `encuadres.test.ts`: mapeo correcto en los extremos de cada tramo, y que la
mezcla nunca salga de `[0, 1]`.

---

## 5. Limpieza

**Se borra:**

- `herramientas/*.py`, `herramientas/*.json`, `herramientas/LEEME.md`
- `public/sujeto.glb`
- `src/features/floating-subject/cel.frag.glsl`
- `src/features/floating-subject/cel.vert.glsl`
- `src/features/floating-subject/contorno.frag.glsl`
- `src/features/floating-subject/contorno.vert.glsl`

**Se queda, cambia por dentro** —
`src/features/floating-subject/sujeto-flotante.tsx`: deja de usar
`useGLTF`/utilidades de esqueleto; monta el plano, carga las texturas de
`public/sujeto/` y lee `cuadros-por-progreso.ts` para decidir qué mostrar.

**Se añade:**

- `src/features/floating-subject/mezcla-frames.vert.glsl`
- `src/features/floating-subject/mezcla-frames.frag.glsl`
- `src/features/floating-subject/cuadros-por-progreso.ts`
- `src/features/floating-subject/cuadros-por-progreso.test.ts`
- `public/sujeto/*.png`

---

## 6. Qué no cambia (por completitud)

- `camera-cuts`, `graphic-world`, `cut-out-shapes`, `composed-type`,
  `direction-panel`: sin cambios.
- La oclusión de la tipografía por profundidad (§2.4 del diseño de origen)
  sigue funcionando igual — el plano ocupa el mismo lugar en el buffer de
  profundidad que antes ocupaba el `.glb`.
- Las decisiones abiertas del diseño de origen (§7: concepto, qué dice la
  tipografía, identidad final del sujeto, mini-juego) siguen abiertas y no
  dependen de este cambio.

---

## 7. Descartado, para no volver a discutirlo (añade a §8 del diseño de origen)

| Qué | Por qué |
|---|---|
| Reconstrucción 3D del sujeto (Hunyuan3D + Blender) | Costaba más tiempo del que el proyecto puede permitirse ahora mismo; el 3D real solo aportaba la cámara moviéndose alrededor de la malla, y eso se conserva igual con un plano en el mismo mundo 3D. |
| Cel shading y contorno en tiempo real (`MeshToonMaterial`, casco invertido) | Ya no hay malla que sombrear; el arte 2D trae el shading horneado. |
| Movimiento propio del sujeto independiente del scroll (parpadeo/respiración en bucle) | Se decidió que el scroll es el único motor de animación del sujeto — más coherente con "la cámara corta, no viaja" (§2.2 del diseño de origen) que un idle-loop paralelo. |
