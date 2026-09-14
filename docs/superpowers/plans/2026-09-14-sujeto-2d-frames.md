# El sujeto pasa a frames 2D — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el sujeto 3D real-time (`.glb` con cel shading en Three.js) por un plano billboard texturizado con frames 2D generados en krea.ai, cuyo frame activo depende del progreso continuo del scroll dentro del tramo de la parada de cámara actual.

**Architecture:** Dos funciones puras nuevas (`progresoLocalDesdeGlobal`, `cuadrosPorProgreso`) traducen el progreso de scroll ya existente en qué par de frames mezclar y en qué proporción. `SujetoFlotante` deja de cargar un `.glb` y monta un `<Billboard>` de drei con un plano y un `ShaderMaterial` propio (`mezcla-frames.*.glsl`) que mezcla dos texturas por un uniform `uMezcla`. Los frames son PNG con fondo transparente en `public/sujeto/`, listados por un manifiesto `frames-sujeto.ts` indexado por el nombre de cada ancla de `camera-cuts/encuadres.ts`. Todo el pipeline Hunyuan3D/Blender (`herramientas/`) y los shaders de cel shading/contorno en tiempo real se eliminan del repo.

**Tech Stack:** React Three Fiber, @react-three/drei (`Billboard`, `useTexture`), Three.js `ShaderMaterial`, Vitest, Bun, ImageMagick (`convert`, solo para generar los PNG de relleno de esta implementación — no entra como dependencia del proyecto).

**Spec:** `docs/superpowers/specs/2026-09-14-sujeto-2d-frames-design.md`

## Global Constraints

- Ficheros en **kebab-case** (regla de Biome, `useFilenamingConvention`).
- Nombres en castellano salvo los hooks de React, que conservan el prefijo inglés `use` (regla de React/devtools).
- **No se testean píxeles, se testea la matemática** — cada función pura nueva lleva test; los shaders y el resultado visual no.
- **Nada de trabajo intermedio entra al repo** — solo los PNG finales en `public/sujeto/`.
- Formato: 2 espacios, ancho de línea 100 (`biome.json`). Verificar con `bun run check`.
- Compilación: `bun run build` (`tsc --noEmit && vite build`) debe pasar sin errores tras cada tarea.
- Sin comentarios que expliquen QUÉ hace el código — solo el PORQUÉ cuando no sea obvio (convención ya vigente en el repo, ver comentarios existentes en `progreso-scroll.ts`, `muelle-tenso.ts`).

---

### Task 1: `progresoLocalDesdeGlobal` — progreso dentro del tramo activo

**Files:**
- Modify: `src/features/camera-cuts/progreso-scroll.ts`
- Test: `src/features/camera-cuts/progreso-scroll.test.ts`

**Interfaces:**
- Consumes: la función privada `recortar(v, minimo, maximo)` ya definida en el propio fichero.
- Produces: `progresoLocalDesdeGlobal(progreso: number, paradas: number, indice: number): number` — usada por `SujetoFlotante` (Task 4) para saber cuánto se ha avanzado dentro del tramo de la ancla activa.

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al final de `src/features/camera-cuts/progreso-scroll.test.ts`:

```ts
describe("progresoLocalDesdeGlobal", () => {
  test("al entrar en el tramo el progreso local es 0", () => {
    expect(progresoLocalDesdeGlobal(0.25, 4, 1)).toBeCloseTo(0, 6);
  });

  test("a mitad del tramo el progreso local es 0.5", () => {
    expect(progresoLocalDesdeGlobal(0.375, 4, 1)).toBeCloseTo(0.5, 6);
  });

  test("al final del tramo el progreso local es 1", () => {
    expect(progresoLocalDesdeGlobal(0.5, 4, 1)).toBeCloseTo(1, 6);
  });

  test("recorta si el progreso global cae fuera del tramo de esa ancla", () => {
    expect(progresoLocalDesdeGlobal(0.1, 4, 1)).toBe(0);
    expect(progresoLocalDesdeGlobal(0.9, 4, 1)).toBe(1);
  });

  test("sin paradas devuelve 0 en vez de dividir por cero", () => {
    expect(progresoLocalDesdeGlobal(0.5, 0, 0)).toBe(0);
  });
});
```

Y actualizar el import de la primera línea del test a:

```ts
import { indiceDesdeProgreso, progresoDesdeScroll, progresoLocalDesdeGlobal } from "./progreso-scroll";
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `bunx vitest run src/features/camera-cuts/progreso-scroll.test.ts`
Expected: FAIL — `progresoLocalDesdeGlobal` no existe en el módulo.

- [ ] **Step 3: Implementar**

Añadir al final de `src/features/camera-cuts/progreso-scroll.ts`:

```ts
/**
 * Progreso global → progreso local dentro del tramo de la parada activa.
 *
 * `cuadrosPorProgreso` necesita saber cuánto se ha recorrido DENTRO del tramo
 * de la ancla activa, no en todo el recorrido — cada franja ocupa 1/paradas
 * del progreso global (mismo reparto que `indiceDesdeProgreso`).
 */
export function progresoLocalDesdeGlobal(
  progreso: number,
  paradas: number,
  indice: number,
): number {
  if (paradas <= 0) return 0;
  const ancho = 1 / paradas;
  const inicio = indice * ancho;
  return recortar((progreso - inicio) / ancho, 0, 1);
}
```

- [ ] **Step 4: Ejecutar y comprobar que pasa**

Run: `bunx vitest run src/features/camera-cuts/progreso-scroll.test.ts`
Expected: PASS, las 5 pruebas nuevas y las ya existentes en verde.

- [ ] **Step 5: Commit**

```bash
git add src/features/camera-cuts/progreso-scroll.ts src/features/camera-cuts/progreso-scroll.test.ts
git commit -m "camera-cuts: progreso local dentro del tramo de la parada activa"
```

---

### Task 2: `cuadrosPorProgreso` — qué par de frames mezclar

**Files:**
- Create: `src/features/floating-subject/cuadros-por-progreso.ts`
- Test: `src/features/floating-subject/cuadros-por-progreso.test.ts`

**Interfaces:**
- Consumes: nada (función pura autocontenida).
- Produces: `type CuadrosFrames = { indiceActual: number; indiceSiguiente: number; mezcla: number }` y `cuadrosPorProgreso(progresoLocal: number, numFrames: number): CuadrosFrames` — usada por `SujetoFlotante` (Task 4) para elegir qué dos texturas de un `framesPorAncla[ancla]` mezclar.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/floating-subject/cuadros-por-progreso.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { cuadrosPorProgreso } from "./cuadros-por-progreso";

describe("cuadrosPorProgreso", () => {
  test("en progreso 0 se ve el primer frame puro", () => {
    expect(cuadrosPorProgreso(0, 3)).toEqual({ indiceActual: 0, indiceSiguiente: 1, mezcla: 0 });
  });

  test("en progreso 1 se ve el último frame puro", () => {
    expect(cuadrosPorProgreso(1, 3)).toEqual({ indiceActual: 1, indiceSiguiente: 2, mezcla: 1 });
  });

  test("reparte el progreso entre todos los frames por igual", () => {
    // con 3 frames el tramo se parte en dos mitades: 0-0.5 y 0.5-1
    expect(cuadrosPorProgreso(0.25, 3)).toEqual({
      indiceActual: 0,
      indiceSiguiente: 1,
      mezcla: 0.5,
    });
    expect(cuadrosPorProgreso(0.75, 3)).toEqual({
      indiceActual: 1,
      indiceSiguiente: 2,
      mezcla: 0.5,
    });
  });

  test("recorta si el progreso local llega fuera de [0, 1]", () => {
    expect(cuadrosPorProgreso(-0.4, 3).indiceActual).toBe(0);
    expect(cuadrosPorProgreso(1.8, 3)).toEqual({
      indiceActual: 1,
      indiceSiguiente: 2,
      mezcla: 1,
    });
  });

  test("con un solo frame no hay nada que mezclar", () => {
    expect(cuadrosPorProgreso(0.5, 1)).toEqual({ indiceActual: 0, indiceSiguiente: 0, mezcla: 0 });
  });

  test("sin frames tampoco revienta", () => {
    expect(cuadrosPorProgreso(0.5, 0)).toEqual({ indiceActual: 0, indiceSiguiente: 0, mezcla: 0 });
  });
});
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `bunx vitest run src/features/floating-subject/cuadros-por-progreso.test.ts`
Expected: FAIL — el módulo `./cuadros-por-progreso` no existe.

- [ ] **Step 3: Implementar**

Crear `src/features/floating-subject/cuadros-por-progreso.ts`:

```ts
/**
 * Progreso local dentro de un tramo (0-1) → qué par de frames mezclar.
 *
 * Cada ancla trae un turnaround de N frames: el primero es la llegada al
 * tramo, el último la pose asentada. El progreso local escala ese rango — en
 * 0 se ve el primer frame puro, en 1 el último frame puro.
 */
export type CuadrosFrames = {
  indiceActual: number;
  indiceSiguiente: number;
  mezcla: number;
};

export function cuadrosPorProgreso(progresoLocal: number, numFrames: number): CuadrosFrames {
  if (numFrames <= 1) return { indiceActual: 0, indiceSiguiente: 0, mezcla: 0 };

  const p = Math.min(Math.max(progresoLocal, 0), 1);
  const escalado = p * (numFrames - 1);
  const indiceActual = Math.min(Math.floor(escalado), numFrames - 2);
  const indiceSiguiente = indiceActual + 1;
  const mezcla = escalado - indiceActual;

  return { indiceActual, indiceSiguiente, mezcla };
}
```

- [ ] **Step 4: Ejecutar y comprobar que pasa**

Run: `bunx vitest run src/features/floating-subject/cuadros-por-progreso.test.ts`
Expected: PASS, las 6 pruebas en verde.

- [ ] **Step 5: Commit**

```bash
git add src/features/floating-subject/cuadros-por-progreso.ts src/features/floating-subject/cuadros-por-progreso.test.ts
git commit -m "floating-subject: qué par de frames mezclar según el progreso local"
```

---

### Task 3: Manifiesto de frames y PNG de relleno

**Files:**
- Create: `src/features/floating-subject/frames-sujeto.ts`
- Create: `src/features/floating-subject/frames-sujeto.test.ts`
- Create: `public/sujeto/lejos-0.png`, `lejos-1.png`, `lejos-2.png`, `cuerpo-0.png`, `cuerpo-1.png`, `cuerpo-2.png`, `hombro-0.png`, `hombro-1.png`, `hombro-2.png`, `cara-0.png`, `cara-1.png`, `cara-2.png`

**Interfaces:**
- Consumes: `encuadres` de `@/features/camera-cuts/encuadres` (solo en el test, para verificar cobertura).
- Produces: `framesPorAncla: Record<string, readonly string[]>` — usado por `SujetoFlotante` (Task 4) para saber qué texturas cargar y en qué orden.

**Nota:** estos PNG son relleno de desarrollo, no el arte final. El pipeline real con krea.ai (§1 del diseño) es trabajo manual fuera de este plan — cuando existan los frames definitivos, se sustituyen estos ficheros uno a uno sin tocar código, porque `frames-sujeto.ts` solo lista rutas.

- [ ] **Step 1: Generar los PNG de relleno**

Run:

```bash
mkdir -p public/sujeto
for ancla_color in "lejos:#f4b528" "cuerpo:#c65b1a" "hombro:#288020" "cara:#f7deae"; do
  ancla="${ancla_color%%:*}"
  color="${ancla_color##*:}"
  for i in 0 1 2; do
    x=$((80 + i * 120))
    convert -size 512x768 xc:none \
      -fill "$color" -draw "roundrectangle 40,120 472,700 40,40" \
      -fill "#171717" -draw "circle $x,200 $x,240" \
      -gravity south -pointsize 40 -fill "#171717" -annotate +0+20 "$ancla $i" \
      "public/sujeto/$ancla-$i.png"
  done
done
ls public/sujeto/
```

Expected: 12 ficheros `public/sujeto/<ancla>-<indice>.png` listados.

- [ ] **Step 2: Escribir el test que falla**

Crear `src/features/floating-subject/frames-sujeto.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { encuadres } from "@/features/camera-cuts/encuadres";
import { framesPorAncla } from "./frames-sujeto";

describe("framesPorAncla", () => {
  test("cada ancla del recorrido tiene su set de frames", () => {
    for (const encuadre of encuadres) {
      expect(framesPorAncla[encuadre.nombre]).toBeDefined();
    }
  });

  test("cada set trae al menos dos frames, para poder mezclar", () => {
    for (const frames of Object.values(framesPorAncla)) {
      expect(frames.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("cada frame referenciado existe en public/", () => {
    for (const frames of Object.values(framesPorAncla)) {
      for (const ruta of frames) {
        const archivo = join(process.cwd(), "public", ruta.replace(/^\//, ""));
        expect(existsSync(archivo)).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 3: Ejecutar y comprobar que falla**

Run: `bunx vitest run src/features/floating-subject/frames-sujeto.test.ts`
Expected: FAIL — el módulo `./frames-sujeto` no existe.

- [ ] **Step 4: Implementar el manifiesto**

Crear `src/features/floating-subject/frames-sujeto.ts`:

```ts
/**
 * Qué frames tiene el turnaround de cada ancla, en orden.
 *
 * El primero es la llegada al tramo, el último la pose asentada al llegar a
 * la parada — `cuadrosPorProgreso` mezcla entre ellos según el progreso local.
 *
 * De relleno mientras no exista el arte final de krea.ai (ver diseño del
 * 14-09, §1): sustituir los PNG en public/sujeto/ no requiere tocar este
 * fichero salvo que cambie el número de frames por ancla.
 */
export const framesPorAncla: Record<string, readonly string[]> = {
  lejos: ["/sujeto/lejos-0.png", "/sujeto/lejos-1.png", "/sujeto/lejos-2.png"],
  cuerpo: ["/sujeto/cuerpo-0.png", "/sujeto/cuerpo-1.png", "/sujeto/cuerpo-2.png"],
  hombro: ["/sujeto/hombro-0.png", "/sujeto/hombro-1.png", "/sujeto/hombro-2.png"],
  cara: ["/sujeto/cara-0.png", "/sujeto/cara-1.png", "/sujeto/cara-2.png"],
};
```

- [ ] **Step 5: Ejecutar y comprobar que pasa**

Run: `bunx vitest run src/features/floating-subject/frames-sujeto.test.ts`
Expected: PASS, las 3 pruebas en verde.

- [ ] **Step 6: Commit**

```bash
git add src/features/floating-subject/frames-sujeto.ts src/features/floating-subject/frames-sujeto.test.ts public/sujeto/
git commit -m "floating-subject: manifiesto de frames por ancla, con PNG de relleno"
```

---

### Task 4: El shader de mezcla y el nuevo `SujetoFlotante`

**Files:**
- Create: `src/features/floating-subject/mezcla-frames.vert.glsl`
- Create: `src/features/floating-subject/mezcla-frames.frag.glsl`
- Modify: `src/features/floating-subject/sujeto-flotante.tsx` (reescritura completa)

**Interfaces:**
- Consumes: `encuadres` de `@/features/camera-cuts/encuadres`; `indiceDesdeProgreso`, `progresoDesdeScroll`, `progresoLocalDesdeGlobal` de `@/features/camera-cuts/progreso-scroll` (Task 1); `cuadrosPorProgreso` de `./cuadros-por-progreso` (Task 2); `framesPorAncla` de `./frames-sujeto` (Task 3); `Billboard`, `useTexture` de `@react-three/drei`.
- Produces: `SujetoFlotante()` — mismo nombre y firma sin props que ya consume `src/app/app.tsx:52`, así que ese fichero no cambia.

**Nota:** `sujeto-flotante.tsx` deja de importar `cel.frag.glsl`, `cel.vert.glsl`, `contorno.frag.glsl`, `contorno.vert.glsl` y `/sujeto.glb`, pero esos ficheros no se borran todavía en esta tarea — la Task 5 los elimina una vez confirmado que nada los usa, para que el build nunca esté roto entre pasos.

- [ ] **Step 1: Escribir el vertex shader**

Crear `src/features/floating-subject/mezcla-frames.vert.glsl`:

```glsl
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

- [ ] **Step 2: Escribir el fragment shader**

Crear `src/features/floating-subject/mezcla-frames.frag.glsl`:

```glsl
uniform sampler2D uFrameActual;
uniform sampler2D uFrameSiguiente;
uniform float uMezcla;

varying vec2 vUv;

void main() {
  vec4 actual = texture2D(uFrameActual, vUv);
  vec4 siguiente = texture2D(uFrameSiguiente, vUv);
  gl_FragColor = mix(actual, siguiente, uMezcla);
}
```

- [ ] **Step 3: Reescribir `sujeto-flotante.tsx`**

Reemplazar el contenido completo de `src/features/floating-subject/sujeto-flotante.tsx` por:

```tsx
import { Billboard, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { NoColorSpace, type ShaderMaterial, type Texture } from "three";
import { encuadres } from "@/features/camera-cuts/encuadres";
import {
  indiceDesdeProgreso,
  progresoDesdeScroll,
  progresoLocalDesdeGlobal,
} from "@/features/camera-cuts/progreso-scroll";
import { cuadrosPorProgreso } from "./cuadros-por-progreso";
import { framesPorAncla } from "./frames-sujeto";
import mezclaFragmento from "./mezcla-frames.frag.glsl?raw";
import mezclaVertice from "./mezcla-frames.vert.glsl?raw";

const RUTAS_TODOS_LOS_FRAMES = Object.values(framesPorAncla).flat();

/** Tamaño del plano en unidades de mundo. Provisional hasta que llegue el arte final. */
const ANCHO = 1.3;
const ALTO = 1.9;

function crearUniforms(inicial: Texture) {
  return {
    uFrameActual: { value: inicial },
    uFrameSiguiente: { value: inicial },
    uMezcla: { value: 0 },
  };
}

type Uniforms = ReturnType<typeof crearUniforms>;

/**
 * El sujeto: un plano orientado a cámara con el arte 2D de krea.ai como
 * textura, en vez de una malla 3D sombreada en tiempo real — ver
 * docs/superpowers/specs/2026-09-14-sujeto-2d-frames-design.md.
 *
 * El scroll es su único motor de animación: no hay reloj propio, giro ni
 * deriva independiente del visitante. El progreso DENTRO del tramo de la
 * ancla activa decide qué frame de su turnaround se ve.
 */
export function SujetoFlotante() {
  const material = useRef<ShaderMaterial>(null);

  const texturasCargadas = useTexture(RUTAS_TODOS_LOS_FRAMES);
  const texturasPorRuta = useMemo(() => {
    const mapa = new Map<string, Texture>();
    RUTAS_TODOS_LOS_FRAMES.forEach((ruta, i) => {
      const textura = texturasCargadas[i];
      if (!textura) return;
      // el shader escribe directo al framebuffer sin conversión de vuelta,
      // así que la textura se pide en crudo — mismo motivo que el atlas del
      // sujeto anterior
      textura.colorSpace = NoColorSpace;
      textura.needsUpdate = true;
      mapa.set(ruta, textura);
    });
    return mapa;
  }, [texturasCargadas]);

  const primeraTextura = texturasCargadas[0];
  if (!primeraTextura) throw new Error("No se cargó ningún frame del sujeto");
  const iniciales = useMemo(() => crearUniforms(primeraTextura), [primeraTextura]);

  useFrame(() => {
    const u = material.current?.uniforms as Uniforms | undefined;
    if (!u) return;

    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    const progreso = progresoDesdeScroll(window.scrollY, recorrido);
    const indice = indiceDesdeProgreso(progreso, encuadres.length);
    const progresoLocal = progresoLocalDesdeGlobal(progreso, encuadres.length, indice);

    const encuadre = encuadres[indice];
    if (!encuadre) return;
    const frames = framesPorAncla[encuadre.nombre];
    if (!frames || frames.length === 0) return;

    const { indiceActual, indiceSiguiente, mezcla } = cuadrosPorProgreso(
      progresoLocal,
      frames.length,
    );

    const rutaActual = frames[indiceActual];
    const rutaSiguiente = frames[indiceSiguiente];
    const texturaActual = rutaActual ? texturasPorRuta.get(rutaActual) : undefined;
    const texturaSiguiente = rutaSiguiente ? texturasPorRuta.get(rutaSiguiente) : undefined;

    if (texturaActual) u.uFrameActual.value = texturaActual;
    if (texturaSiguiente) u.uFrameSiguiente.value = texturaSiguiente;
    u.uMezcla.value = mezcla;
  });

  return (
    <Billboard position={[0, 0.42, 0]}>
      <mesh>
        <planeGeometry args={[ANCHO, ALTO]} />
        <shaderMaterial
          ref={material}
          fragmentShader={mezclaFragmento}
          vertexShader={mezclaVertice}
          transparent
          uniforms={iniciales}
        />
      </mesh>
    </Billboard>
  );
}

useTexture.preload(RUTAS_TODOS_LOS_FRAMES);
```

- [ ] **Step 4: Comprobar que compila**

Run: `bun run build`
Expected: sin errores de TypeScript ni de Vite. Los ficheros `cel.*.glsl` y `contorno.*.glsl` quedan huérfanos en disco (nada los importa ya) pero no rompen la compilación — se borran en la Task 5.

- [ ] **Step 5: Verificar en el navegador**

Run: `bun run dev` (en segundo plano) y abrir `http://localhost:5173`.

Comprobar a mano:
- El plano del sujeto aparece en la escena, sin errores en la consola.
- Al hacer scroll, la textura cambia de frame dentro de cada tramo (se nota el color/posición del círculo del PNG de relleno moviéndose) y se asienta en el último frame al llegar a cada parada.
- El plano sigue ocluyendo la tipografía según la profundidad, igual que antes.

Parar el servidor de dev al terminar.

- [ ] **Step 6: Commit**

```bash
git add src/features/floating-subject/sujeto-flotante.tsx src/features/floating-subject/mezcla-frames.vert.glsl src/features/floating-subject/mezcla-frames.frag.glsl
git commit -m "floating-subject: el sujeto pasa de malla 3D a plano con frames 2D"
```

---

### Task 5: Limpieza — fuera Hunyuan3D, cel shading y ajustes muertos

**Files:**
- Delete: `herramientas/` (directorio completo)
- Delete: `public/sujeto.glb`
- Delete: `src/features/floating-subject/cel.frag.glsl`, `cel.vert.glsl`, `contorno.frag.glsl`, `contorno.vert.glsl`
- Modify: `src/features/direction-panel/ajustes-direccion.ts`
- Modify: `src/features/direction-panel/panel-direccion.tsx`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `ajustesDireccion` sin las claves `cel` y `sujeto` — verificar que no queda ninguna referencia a ellas antes de borrarlas.

- [ ] **Step 1: Confirmar que nada más usa lo que se va a borrar**

Run: `grep -rn "ajustesDireccion\.\(cel\|sujeto\)\|cel\.\(frag\|vert\)\|contorno\.\(frag\|vert\)\|sujeto\.glb\|herramientas/" src/ index.html`
Expected: solo apariciones dentro de `src/features/direction-panel/panel-direccion.tsx` (las que se van a editar en el Step 4). Si aparece cualquier otro fichero, parar y revisar antes de seguir — significa que algo más depende de lo que se va a borrar.

- [ ] **Step 2: Borrar el pipeline y los assets viejos**

Run:

```bash
git rm -r herramientas/
git rm public/sujeto.glb
git rm src/features/floating-subject/cel.frag.glsl src/features/floating-subject/cel.vert.glsl
git rm src/features/floating-subject/contorno.frag.glsl src/features/floating-subject/contorno.vert.glsl
```

- [ ] **Step 3: Quitar `cel` y `sujeto` de `ajustes-direccion.ts`**

Reemplazar el contenido completo de `src/features/direction-panel/ajustes-direccion.ts` por:

```ts
/**
 * Los valores que el panel de dirección toca en vivo.
 *
 * Es un objeto MUTABLE a propósito, no estado de React: lo lee `MundoGrafico`
 * en cada fotograma, así que moverlo no tiene por qué pasar por el
 * reconciliador. Lo que sí necesita React —las palabras, porque regenerar la
 * textura es un efecto— vive aparte.
 *
 * En una pieza que es 90% dirección, poder mover esto en caliente es la
 * diferencia entre iterar 200 veces o 20.
 */
export const ajustesDireccion = {
  mundo: {
    angulo: 22,
    densidad: 34,
    bandas: true,
    semitono: true,
    grano: true,
    desregistro: true,
  },
};

export type AjustesDireccion = typeof ajustesDireccion;
```

- [ ] **Step 4: Quitar los paneles "Cel shading" y "Sujeto" de `panel-direccion.tsx`**

En `src/features/direction-panel/panel-direccion.tsx`, borrar estas líneas (el bloque `cel` y el bloque `sujeto` completos):

```ts
    const cel = pane.addFolder({ title: "Cel shading" });
    cel.addBinding(ajustesDireccion.cel, "corteLuz", { min: -1, max: 1, step: 0.01 });
    cel.addBinding(ajustesDireccion.cel, "corteSombra", { min: -1, max: 1, step: 0.01 });
    cel.addBinding(ajustesDireccion.cel, "medio", { min: 0, max: 1, step: 0.01 });
    cel.addBinding(ajustesDireccion.cel, "sombra", { min: 0, max: 1, step: 0.01 });
    cel.addBinding(ajustesDireccion.cel, "grosorContorno", { min: 0, max: 0.05, step: 0.001 });

    const sujeto = pane.addFolder({ title: "Sujeto" });
    sujeto.addBinding(ajustesDireccion.sujeto, "giro", { min: 0, max: 1, step: 0.01 });
    sujeto.addBinding(ajustesDireccion.sujeto, "deriva", { min: 0, max: 0.4, step: 0.005 });
```

El fichero queda con el folder "Mundo gráfico" seguido directamente del folder "Tipografía".

- [ ] **Step 5: Comprobar formato, tipos y tests**

Run: `bun run check`
Expected: sin errores de Biome (si reformatea algo, revisar el diff y aceptarlo).

Run: `bun run build`
Expected: sin errores de TypeScript ni de Vite.

Run: `bun run test`
Expected: toda la suite en verde, incluidas las pruebas de las Tasks 1-3.

- [ ] **Step 6: Verificar en el navegador**

Run: `bun run dev` y abrir la pieza. Comprobar que el panel de dirección (`PanelDireccion`) ya no muestra "Cel shading" ni "Sujeto", que "Mundo gráfico" y "Tipografía" siguen funcionando, y que no hay errores en consola. Parar el servidor.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Elimina el pipeline de Hunyuan3D/Blender y el cel shading en tiempo real"
```
