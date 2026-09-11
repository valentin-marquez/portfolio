# Pieza web 3D — diseño

**Fecha:** 2026-09-11
**Estado:** dirección visual y técnica cerradas. **El concepto está abierto.**

---

## 0. Qué es esto y qué no

Una **pieza web**, no un portafolio. No busca trabajo, no lleva CTA, no dice "contrátame".
Es una obra: se abre, se mira, se cierra. El listón es el de un sitio que aspira a premio —
el sitio *es* la pieza — así que puede pedir paciencia al visitante, cargar assets pesados y
construir una experiencia con ritmo en vez de una lista de proyectos.

**Criterio de éxito:** que alguien la deje abierta un minuto sin hacer nada. Si aburre a los
diez segundos, ha fallado por bonita que sea.

**Estado real:** tenemos un lenguaje visual potente y definido, y un sujeto que funciona.
Todavía no tenemos qué dice la pieza. Ver §7, decisión abierta #1.

### 0.1 Por qué 3D y no ilustración

La pregunta es legítima, sobre todo viendo lo buena que es la referencia de dirección (§2.0):
si una ilustración ya se ve así, ¿para qué el 3D?

**Por la cámara, y solo por la cámara.** Una ilustración no se recorre, no rota, no se atraviesa
y no responde al scroll. Todo lo que convierte esto en una pieza web en vez de un JPG vive en
poder moverse por dentro.

**Corolario honesto:** el día que se decida que el recorrido de cámara no aporta, la respuesta
correcta no es "hagamos el 3D más bonito", es **no hacer 3D** — y ahorrarse semanas.

---

## 1. Historia de la decisión

Se escribe para no volver a discutirlo. Hubo dos direcciones; la primera se descartó entera.

### Dirección A — descartada: "el objeto perdido"

Un cuerpo a la deriva en el vacío, girando a su propio ritmo, luz cálida rasante desde la
izquierda, drone subsónico, cámara acercándose con muelles blandos. Tono melancólico y en paz.

Se descartó al pedir **dirección gráfica tipo Persona**. Son temperamentos opuestos: uno lento
e indiferente, el otro seco y a golpes. Mezclarlos sin criterio no da las dos cosas, da ruido.

**Lo que murió con ella:** el vacío negro, la key cálida única, el mapa de entorno, los muelles
blandos con sobreimpulso largo, la rotación de 60-90 s, el drone, el material metálico, y el
concepto del objeto perdido.

**Lo que sobrevivió:** el sujeto y su pipeline completa, el stack técnico entero, la tipografía
enorme como eje de composición, y el scroll como único control del visitante.

### Dirección B — vigente: escena 3D en clave gráfica

Se mantiene el espacio tridimensional y el recorrido de cámara, pero el mundo se vuelve
gráfico. Es explícitamente la mezcla más difícil de las que se barajaron, y §2 existe para
que no salga confusa.

**Riesgo asumido y conocido:** el lenguaje de Persona está muy imitado y es reconocible al
instante. Hecho tal cual, se lee como fan-site, no como voz propia. La defensa es no copiar
la paleta — crema, mostaza y naranja quemado en vez de rojo sangre sobre negro — y el
contraste de un personaje cozy con una maceta dentro de un lenguaje agresivo.

---

## 2. Dirección visual

### 2.0 Referencia de dirección

**`docs/referencias/direccion-visual-key-art.png`**

Es el objetivo. Todo lo que se construya se juzga contra esa imagen: si el navegador no se
parece a eso, está mal.

**Lo que establece:** contorno de tinta grueso, bandas de tono duras sin degradado, semitono
sobre los planos, diagonales con nada alineado al eje, contrapicado dramático, y la paleta
exacta — crema, mostaza, naranja quemado, carbón, con el verde del brote como único acento
saturado.

**Cómo se generó:** con el bloque de estilo de §2 sin línea de escena. El fondo — postes de
luz, tendido eléctrico, edificios, andamios — lo inventó el generador. Esa deriva hacia lo
urbano no estaba en ninguna de las cuatro direcciones propuestas y merece considerarse como
una quinta: la calle en vez del cuarto (§7, #1).

**Paleta, extraída de la propia imagen** (cuantización con fusión de familias; el semitono se
promedia reduciendo la imagen antes de medir):

| Familia | Luz | Medio | Sombra |
|---|---|---|---|
| **Crema** | `#f7deae` 13,8% | `#e6c281` 4,3% | `#aa8d5c` 3,3% |
| **Ámbar** | `#f4b528` 8,4% | `#d39031` 1,7% | `#c65b1a` 6,7% |
| **Tinta** | `#403931` 17,7% | — | `#171717` 42,6% |
| **Verde** (acento) | `#288020` | — | `#616f3b` 1,6% |

Dos hallazgos con consecuencias:

- **El negro domina con el 42,6%.** Esto no es una página crema con líneas negras: es una pieza
  **negra** con campos cálidos encima. El fondo por defecto de la web es oscuro.
- **La paleta ya viene en bandas de luz/medio/sombra por familia.** No hay que inventar la rampa
  del cel shading — los mapas de degradado salen directos de esta tabla.
- El verde hay que buscarlo aparte: ocupa tan poca superficie que no entra en una cuantización
  general, y el naranja es más saturado. **El acento es pequeño y no es el color más saturado
  del cuadro** — el verde no grita, solo está. Mantenerlo así.

**Diferencias conocidas entre la ilustración y lo que dará el 3D:**

| Qué | Por qué difiere | Plan |
|---|---|---|
| **Grosor de línea variable** | El casco invertido da grosor constante; la ilustración engorda y adelgaza la línea. **Es la diferencia más visible de las tres.** | Empezar modulando el grosor por distancia de cámara — una línea de shader, ~90% del efecto. Si no basta, pintar grosor en colores de vértice (técnica de Guilty Gear): control total, pero hay que pintar a mano sobre 60k triángulos. |
| Pelo | Dibujado como formas planas puntiagudas; en 3D se leerá más redondo y blando. | Asumido. |
| Trenzas del jersey | Dibujadas como línea; en el modelo son geometría real y se leerán como volumen. | Asumido. Los renders de prueba confirmaron que el volumen funciona. |

**Dónde se hace el cel shading:** en **Three.js, en tiempo real**, no en Blender. `MeshToonMaterial`
con un mapa de degradado de tres o cuatro píxeles da las bandas duras; el contorno sale del casco
invertido. Blender solo necesita una previsualización aproximada para no trabajar a ciegas.

También se guarda **`docs/referencias/personaje-referencia-frontal.png`**, la referencia frontal
que alimenta la reconstrucción 3D (§3.2). Cumple otro propósito distinto: ésa se reconstruye,
la de dirección solo se mira.

### 2.1 El truco central: el sujeto es 3D, el mundo es 2D

El error que hunde estas escenas es construir un entorno tridimensional y pintarlo de colores
planos: queda un render raro, ni una cosa ni la otra.

**El fondo no obedece a la perspectiva en absoluto.** Bandas diagonales, campos de trama,
formas recortadas — todo resuelto como una capa de pantalla completa detrás del sujeto, con
lógica gráfica propia (desliza, encaja de golpe), sin profundidad ni punto de fuga.

La figura tiene volumen. El mundo es cartel. Esa separación tajante es lo que hace que funcione.

### 2.2 La cámara corta, no viaja

El scroll deja de mover una cámara por una curva continua y pasa a **avanzar un índice de
encuadre**. Cada parada es una composición cerrada; entre ellas hay un golpe.

- Muelle rápido y tenso con sobreimpulso mínimo, o corte seco.
- **El color del fondo cambia en el mismo fotograma.** Ese es el latido de la pieza.
- **Ángulo holandés por parada:** entre 5° y 12°, distinto en cada una. Nada alineado al eje.

### 2.3 Cel shading con contorno

- Rampa de dos o tres tonos planos. Sin reflejos, sin PBR.
- **El contorno se hace con casco invertido**, no con detección de bordes en el post.
  Razón: la malla viene de un generador por IA, con topología ondulada y normales irregulares;
  un detector de bordes dibujaría líneas por toda la superficie donde no hay ningún borde real.
  El casco invertido (duplicar malla, invertir normales, escalar un poco, negro) da línea
  gruesa y constante y **le da igual lo grumosa que sea la topología**.
- La dirección de la luz solo decide **dónde cae la banda de sombra**. No hay que equilibrar
  key y fill.

### 2.4 Tipografía

Enorme, como parte de la composición — no sobreimpresa. **Dentro de la escena 3D**, en planos
a distinta profundidad, para que el cuerpo la ocluya por buffer de profundidad y el parallax
salga gratis al mover la cámara.

Qué dice: **abierto** (§7, #2).

### 2.5 Sonido

Percusivo, no ambiental. Un golpe en cada encaje de cámara; el ritmo lo marcan los cortes.

**Restricción de navegador:** el audio no arranca sin gesto del usuario. Hace falta una puerta
de entrada, que además cubre la carga — se entra con todo listo, sin tirones.

---

## 3. El sujeto

Un personaje chibi cozy: pelo negro abundante, gafas cuadradas de montura gruesa, jersey de
trenzas holgado, pantalón ancho, botas, y **una maceta con un brote sostenida contra el pecho**.
Derivado de una foto real del autor, estilizado.

**Identidad final: abierta** (§7, #4). Nada depende de ella — la escena se dirige contra un
placeholder y el `.glb` se enchufa después.

### 3.1 Lo que se probó y se aprendió

Tanda de 4 modelos por **text-to-3D** en Hunyuan3D, decimados e inspeccionados:

| | triángulos | vértices | alto | ancho |
|---|---|---|---|---|
| c1 | 496.616 | 288.197 | 1,155 | 0,625 |
| c2 | 499.956 | 302.855 | 1,159 | 0,606 |
| c3 | 499.210 | 298.212 | 1,154 | 0,605 |
| c4 | 499.410 | 307.164 | 1,122 | 0,656 |

**Funcionó:** geometría limpia en los cuatro — una sola malla, cero trozos sueltos, cero
pedestal. Las gafas de montura gruesa salieron bien en todos. El jersey de trenzas es el mejor
elemento de todos los renders.

**Falló en los cuatro:** el pelo no rodeaba la cabeza (solo flequillo frontal, nuca calva —
grave, porque el sujeto rota); la maceta no apareció nunca; las piernas eran muñones.

**Conclusión:** no era problema de herramienta, era del prompt. El mejor cuerpo y la mejor
cabeza estaban en modelos distintos.

### 3.2 Salto a image-to-3D

**Text-to-3D sirve para tantear; image-to-3D es donde se gana el control.** Se genera primero
una referencia 2D, se corrige hasta que guste, y esa imagen manda sobre la forma mucho más que
cualquier párrafo. El salto de calidad fue grande y está validado.

**Requisitos de la imagen de referencia**, por orden de importancia:

1. **Render 3D, no ilustración 2D.** Registro "figura de vinilo de diseñador". Un dibujo plano
   obliga al reconstructor a inventarse todo el volumen.
2. **Luz plana, sin sombra proyectada en el suelo.** Las sombras duras se interpretan como
   geometría; una mancha en el suelo se convierte en pedestal.
3. **Brazos separados del torso.** Si se tocan en la imagen, salen fusionados en la malla.
4. **Cuerpo entero con margen.** Si recorta los pies, no hay pies.
5. **Pelo voluminoso ya desde el frente** — es la única defensa contra la nuca calva cuando
   solo se da vista frontal. Una vista 3/4 adicional ayuda mucho más.
6. **Que nada cruce la cara.** Lo que la referencia tapa, el reconstructor se lo inventa.

**Formato de subida:** cuadrado, nombre ASCII sin espacios ni comas. Se rellena a 1:1 muestreando
el color de fondo de una esquina, así el relleno es invisible.

### 3.3 Ajustes de Hunyuan3D

| Ajuste | Valor | Por qué |
|---|---|---|
| Face count | **500k** | El destino final son ~60k. Todo lo generado por encima se tira en el decimado. Más densidad = más grumos, y el sombreado los delata. |
| **Simplify mesh** | **desmarcado** | Decimamos nosotros con parámetros controlados. Marcarlo decima dos veces y la segunda pasada trabaja sobre una malla ya degradada. |
| **Octree Resolution** | **384-512** (de 256) | El ajuste de más impacto. Decide si la geometría delgada — montura de gafas, hojas del brote — se resuelve o se funde. Bajar a 384 si falta VRAM. |
| Remove Background | marcado | Fondo gris uniforme, recorte limpio. Sin quitarlo puede construir el fondo como geometría. |
| **Randomize seed** | **desmarcado** | Escribir el seed a mano (1234, 1235...) da la misma variedad sabiendo cuál produjo cuál. Permite volver a una y cambiar una sola variable. |
| Inference Steps | 30 explorando, 50 para la definitiva | Por encima de 50 es tirar tiempo. |
| Guidance Scale | 5 | Subir a 6-7 solo si se aleja de la referencia; pasarse genera artefactos de superficie. |
| Number of Chunks | no tocar | Es troceado para VRAM, no calidad. Bajarlo solo ante error de memoria. |

### 3.4 Pipeline de assets — receta repetible

No es algo que se hace una vez: el sujeto va a cambiar varias veces y cada cambio no puede ser
una tarde de clics irrepetibles.

```
foto real
  → referencia 2D (ChatGPT, requisitos de §3.2)
  → Hunyuan3D image-to-3D (ajustes de §3.3)          → malla cruda ~56 MB / 500k tris
  → gltf-transform: resize texturas, weld, simplify   → ~60k tris / 2-3 MB
  → Blender headless + Python (taller en scratchpad)  → origen, escala, materiales, Draco
  → subject.glb
```

**Medido, no estimado:** 56 MB → 2-3 MB decimando al 12%, y los renders de control se hicieron
sobre las mallas ya decimadas. El presupuesto web está probado de punta a punta.

**Pasos que no puede saltarse el taller local:**

- **Recentrar el origen.** Los cuatro modelos vinieron con `bboxMin.Y = 0` — el origen en los
  pies. Si el sujeto rota así, **no gira: orbita**. Va al centro de masa.
- **Escala real** en metros y normales revisadas.
- **Separación de color** para el cel shading (ver §3.5).
- Export con Draco.

**Nada de trabajo intermedio entra al repo.** Solo llega el `.glb` final.

### 3.5 Separación de color — consecuencia del cel shading

El cel shading **necesita zonas de color distintas**: pelo negro, jersey crema, pantalón carbón,
maceta terracota, brote verde. Con un único tono plano el personaje es una mancha sin lectura.

Esto revierte a medias una simplificación anterior (cuando el material iba a ser metal monocromo,
la textura de la IA era irrelevante y se tiraba entera).

Dos caminos, **decisión abierta** (§7, #3):

- **Cuantizar la textura existente en el shader.** Cero cirugía de malla. Riesgo: las texturas de
  Hunyuan son turbias y al posterizarlas puede salir sucio.
- **Asignar colores planos por zona.** Limpio y verdaderamente gráfico. La malla es una sola pieza
  fusionada, así que hay que seleccionar regiones — pero es automatizable: muestrear el albedo por
  cara, agrupar colores y asignar ranuras de material por script en Blender.

Empezar por lo primero; lo segundo está a un script de distancia.

### 3.6 Rig y animación — decidido: no hay

Los auto-riggers actuales (Meshy, Neural4D, Tripo, AccuRig, Mixamo) resuelven esqueleto y pesos
en segundos, así que **es viable**. No se hace, por dos razones:

**Técnica:** la malla es una isosuperficie — triángulos uniformes sin anillos de aristas en las
articulaciones. Se pellizca al flexionar. Además es una sola pieza fusionada, así que la maceta
está soldada a las manos y no se puede atar a un hueso.

**De diseño:** lo que hay que animar es el encuadre y la capa gráfica, no las extremidades. Un
personaje que gesticula es otra pieza.

**Si hiciera falta movimiento secundario:** shader de vértices con ruido suave, sin esqueleto —
imposible que se pellizque una articulación. Si algún día hace falta de verdad, se cambia el
`.glb` por uno con esqueleto y se reproduce con el mezclador de animaciones. La arquitectura no
se entera.

---

## 4. Arquitectura técnica

### 4.1 Stack

**Bun** (gestor de paquetes y lanzador de scripts) + **Vite** + **React** + **React Three Fiber**
+ **drei** + **postprocessing** + **Biome** (formato y lint, con regla de nombres de fichero en
kebab-case).

El sitio es **estático**: no hay servidor en producción, así que Bun no asume ningún riesgo. Si
algún plugin de Vite diera guerra bajo su runtime, se cae a `bun install` + Node para el dev
server sin perder nada.

### 4.2 Estructura por features, no por tipos

```
src/
  app/
  features/
    graphic-world/        # capa 2D de fondo: bandas, tramas, recortes, cortes de color
    floating-subject/     # el modelo, su material cel, su casco invertido, su reloj propio
    camera-cuts/          # índice de encuadre, ángulos holandeses, muelle tenso
    composed-type/        # tipografía dentro de la escena
    entry-gate/           # puerta, carga, gesto que arranca el audio
    percussive-audio/     # golpes sincronizados con los cortes
    direction-panel/      # Tweakpane, solo en dev
  shared/                 # lo genuinamente transversal, y que sea poquísimo
```

Ficheros en **kebab-case**, rutas que se explican solas, cada feature con sus componentes, sus
hooks, su matemática y sus tests juntos.

### 4.3 Los tres relojes

El modelo mental que mantiene la pieza coherente:

| Reloj | Quién lo mueve | Carácter |
|---|---|---|
| **El sujeto** | su propio tiempo | continuo, indiferente al visitante |
| **La cámara** | el scroll del visitante | por encaje, seco, con muelle tenso |
| **La capa gráfica** | los cortes de cámara | a golpe, sincronizado |

### 4.4 Cómo se amortigua el scroll

**Se amortigua la cámara, nunca el scroll.**

```
rueda/touch → scroll crudo (SIN amortiguar)
            → índice de encuadre
            → estado objetivo de cámara
            → muelle integra la cámara real hacia el objetivo
```

Amortiguar el scroll — lo que hace casi todo el mundo metiendo un smooth-scroll — se siente
**blando y con lag en trackpad**, porque el sistema ya da inercia y se le añade otra encima.
Amortiguando la cámara hay respuesta inmediata al gesto y física al parar.

En la dirección anterior los muelles eran blandos con sobreimpulso largo. **Ahora son tensos y
rápidos**, con sobreimpulso mínimo. Persona aterriza, no se posa.

### 4.5 Anclas con nombre

El recorrido se define sobre encuadres con **anclas nombradas** (`lejos`, `cuerpo`, `hombro`,
`cara`), nunca coordenadas fijas. Cambiar de sujeto = cambiar el `.glb` y reajustar cuatro anclas,
no reescribir la animación.

### 4.6 Qué se testea

Los píxeles no se testean. La matemática sí, y es donde puede romperse algo en silencio:

- El mapeo de scroll a índice de encuadre, incluidos los extremos.
- El integrador de muelle: que converja y no oscile eternamente.
- La evaluación de encuadres y ángulos por índice.

### 4.7 Panel de dirección

Tweakpane en dev para luz, rampa de cel, grosor de contorno, tensión de muelles, ángulos y
paleta. En una pieza que es 90% dirección, es la diferencia entre iterar 200 veces o 20.

---

## 5. Rendimiento y degradación

- Modelo comprimido con Draco, presupuesto ~5 MB. **Probado: 2-3 MB.**
- `dpr` limitado a `[1, 1.75]`.
- **`prefers-reduced-motion`:** sin ángulos holandeses cambiantes, sin sobreimpulso, sin cortes
  bruscos de color. No es opcional.
- **Móvil:** misma escena, `dpr` 1, post reducido.
- **Sin WebGL:** un póster estático bonito. No una pantalla de error.

---

## 6. Taller y herramientas

Todo el trabajo intermedio vive en el **scratchpad de la sesión**, nunca en el repo.

- **`gltf-transform`** vía `npx` — inspección (triángulos, mallas sueltas, bbox, materiales) y
  decimado controlado (`resize`, `weld`, `simplify --ratio 0.12 --error 0.0005`).
- **Blender 5.2.1 LTS**, en modo headless (`blender --background --python script.py`). Se descartó
  BlenderMCP: da sesión viva pero irreproducible, y aquí interesa **un script en disco** que se
  versione y se vuelva a ejecutar. *Aviso: la API `bpy` cambió de 4.x a 5.x — verificar ejecutando,
  no confiando en ejemplos de foros.*
- **Python + Pillow + numpy** para procesado de imágenes y generación de mapas.
- **Visor de contactos**: página con Three.js servida en local y disparada con Playwright, que
  renderiza cada candidato desde cuatro ángulos con el material y la luz de destino. Ventaja sobre
  Blender para juzgar: enseña el resultado **en el motor real** que usará la web.

---

## 7. Decisiones abiertas

### #1 — El concepto (la grande)

Al tirar la dirección melancólica se tiró también el concepto. "Un objeto perdido que lleva mil
años a la deriva" era lo que daba sentido a todo. Ahora hay un lenguaje visual potente y muy
definido que **todavía no tiene nada que decir**.

Lo que hay para trabajar: un personaje cozy, derivado del autor, sosteniendo una planta. El
espacio ya no es el escenario. Se explora generando referencias visuales.

Cinco direcciones sobre la mesa, las cuatro primeras propuestas y la quinta aparecida sola en
la referencia de dirección (§2.0):

| | Dirección | Qué dice | Estado |
|---|---|---|---|
| 1 | **El jardinero dentro de la máquina** | Mantienes vivo algo orgánico dentro de una infraestructura fría. Es el trabajo en la FAO y la identidad técnica en la misma imagen. | Riesgo: metáfora muy transitada. |
| 2 | **El recolector** | Recoges fragmentos dispersos y les das orden — Framerate destilado. | La única donde **el movimiento significa algo**: los cortes secos y el encaje son el contenido, no el estilo. |
| 3 | **El cuarto** | Retrato hecho de objetos: escritorio, monitores, cables, plantas, desorden. | Recomendada. Resuelve el aburrimiento por densidad, da contenido a cada parada de cámara (y con ello cierra #2), y absorbe la dirección 1 entera. |
| 4 | **Crecer a pesar de** | Persistencia: algo crece donde no debería. | La única con **transformación real** — el scroll entrega un cambio de estado. Riesgo: se aleja de lo cozy. |
| 5 | **La calle** | Apareció sola al generar la referencia sin línea de escena: postes, tendido eléctrico, edificios, andamios. | Sin desarrollar. |

**Nada más puede cerrarse hasta que esto se cierre.**

### #2 — Qué dice la tipografía

Es la única voz de la pieza. Depende de #1.

### #3 — Separación de color: cuantizar textura o asignar por zona

Ver §3.5. Empezar por cuantizar; escalar a asignación por script si sale turbio.

### #4 — Identidad final del sujeto

Se diseña contra placeholder. La arquitectura de anclas hace el cambio barato.

### #5 — Mini-juego final

Aparcado. Un juego no es un final, es un segundo proyecto: input, estado, bucle, condición de
victoria, balanceo. Si vuelve, reducido a **un solo verbo**.

---

## 8. Descartado, para no volver a discutirlo

| Qué | Por qué |
|---|---|
| Dirección melancólica | Incompatible con la dirección gráfica elegida (§1). |
| Material metálico y mapa de entorno | Muere con el cel shading. |
| Mario de Nintendo | Riesgo de IP en un sitio público y firmado. El personaje propio es mejor en todos los ejes. |
| Esqueleto y animación de extremidades | §3.6. |
| BlenderMCP | Sesión viva irreproducible; se prefiere script en disco (§6). |
| Detección de bordes para el contorno | Ruido sobre topología generada por IA; casco invertido (§2.3). |
| Amortiguar el scroll | Sensación blanda y con lag en trackpad (§4.4). |
| Cambiar de modelo de IA para el 3D | El cuello de botella es la referencia y los ajustes, no el LLM. |
