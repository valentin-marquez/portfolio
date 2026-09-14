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
referencia que ya fijaba la dirección visual).

1. **Aislar la figura**, con edición de imagen iterativa (ChatGPT): quitar el
   fondo urbano — postes, tendido, edificios — y dejar solo el personaje con
   fondo transparente (o blanco, si hay que recortarlo después a mano).
2. **Generar el character sheet en Krea 2.** Con la figura aislada como referencia de
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

**El sujeto tiene reloj propio; el scroll solo elige el ancla.** Cada ancla no
es una imagen suelta: es un bucle idle de frames. El scroll decide en qué
ancla está la cámara, y con ello qué juego de frames se usa — pero **no** qué
frame se ve. Eso lo lleva el reloj del sujeto, que corre solo: una animación
idle que solo existe si el visitante mueve el ratón no es idle.

El bucle tiene **tiempos desiguales** a propósito: el frame 0 —la pose
asentada— se retiene unos segundos y los demás pasan en un suspiro, así que
lee como un gesto puntual (una respiración) y no como un metrónomo. Con
`prefers-reduced-motion` se congela en el frame 0.

**Los tres relojes del diseño de origen (§4.3) siguen siendo tres**, y el
del sujeto vuelve a ser el que era:

| Reloj | Quién lo mueve | Carácter |
|---|---|---|
| **El sujeto** | su propio tiempo | bucle idle, continuo, indiferente al visitante |
| **La cámara** | el scroll del visitante | por encaje, seco, con muelle tenso |
| **La capa gráfica** | los cortes de cámara | a golpe, sincronizado |

*Historia: el pivote del 14-09 llegó a atar el frame al scroll ("el scroll es
el único motor"). Se probó y se descartó al verlo: el gesto solo existía
mientras alguien scrolleaba, que es lo contrario de un idle.*

---

## 3. El shader de mezcla

Reemplaza a `cel.*.glsl` y `contorno.*.glsl`. Cada frame ya trae el
cel-shading horneado — viene del mismo estilo que la key art, con su propio
contorno de tinta — así que no hace falta rampa de tonos ni casco invertido
en tiempo real.

`mezcla-frames.vert.glsl` / `mezcla-frames.frag.glsl`: dos texturas
(`uFrameActual`, `uFrameSiguiente`) y un uniform `uMezcla` (0-1) que el reloj
idle mueve durante el paso de un frame al siguiente.

**Tres modos de transición**, conmutables en caliente desde el panel
(`uModo`), porque la elección es de dirección y se cierra mirando:

| Modo | Qué hace | Coste |
|---|---|---|
| **corte** (0) | cambio seco, sin mezcla — flipbook clásico | ninguno |
| **trama** (1) | cada píxel salta de un frame al otro según su punto de semitono. Binario: **nunca hay fantasma de doble exposición**, y el patrón es el mismo lenguaje gráfico del fondo | ninguno |
| **flujo** (2) | morph real: un mapa de desplazamiento empuja los píxeles de una pose a la otra | un PNG de flujo por paso del bucle |

El fundido por opacidad puro se probó primero y **se descartó**: cruzar dos
dibujos con opacidad no da movimiento, da transparencia — el personaje se ve
doble. Un ancla sin mapas de flujo cae automáticamente a **trama**.

---

## 4. Lógica nueva y testeable

`ciclo-idle.ts` — función pura:

```
(tiempo, numFrames, ritmo) → { indiceActual, indiceSiguiente, transicion }
```

Es la única lógica nueva de este cambio que vale la pena testear — mismo
criterio que ya rige el proyecto (§4.6 del diseño de origen: los píxeles no
se testean, la matemática sí). Se cubren los bordes del ciclo, la vuelta al
primer frame, el corte seco (transición en 0) y el tiempo negativo, que en JS
da un módulo negativo si no se corrige.

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
