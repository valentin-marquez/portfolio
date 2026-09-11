import { createPortal, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Group, MathUtils, type PerspectiveCamera } from "three";
import { encuadres } from "@/features/camera-cuts/encuadres";
import { paleta } from "@/shared/paleta";
import {
  esperarFuente,
  FAMILIA_DISPLAY,
  type TexturaDeTexto,
  textoComoTextura,
} from "@/shared/texto-como-textura";
import { BarraMenu } from "./barra-menu";
import { coreografia, retardoDeBarra } from "./coreografia-entrada";
import { interiorDesigual, rectanguloIrregular } from "./forma-recortada";
import { Recorte } from "./recorte";

/** Distancia a la que cuelga la capa por delante de la cámara. */
const DISTANCIA = 1;
const GROSOR = 0.02;

const ANCHO_CAJA = 0.86;
const ALTO_CAJA = 0.2;
const ANCHO_BARRA = 0.4;
const ALTO_BARRA = 0.068;

function sinMovimiento(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * La capa de interfaz: formas recortadas en espacio de pantalla.
 *
 * Cuelga de la CÁMARA, no de la escena, así que no obedece a la perspectiva ni a
 * los cortes de encuadre. Es la mitad "discreta" del mundo 2D (la continua —
 * bandas, trama, grano— la pone el shader de fondo).
 *
 * Cada forma lleva su propia inclinación: el ángulo holandés de la cámara aquí
 * no llega, porque estas piezas van con ella.
 */
export function CapaRecortes({
  clave,
  etiquetas,
}: {
  clave: number;
  etiquetas: readonly string[];
}) {
  const camara = useThree((estado) => estado.camera) as PerspectiveCamera;
  const escena = useThree((estado) => estado.scene);
  const grupo = useRef<Group>(null);
  const pivoteCaja = useRef<Group>(null);
  const pivotesBarra = useRef<(Group | null)[]>([]);

  // three solo dibuja lo que cuelga de la escena, y R3F no mete la cámara por
  // defecto: sin esto la capa existe y no se ve
  useEffect(() => {
    escena.add(camara);
    return () => {
      escena.remove(camara);
    };
  }, [escena, camara]);

  useFrame(() => {
    // se escala para que una unidad sea la altura visible: así las coordenadas de
    // las formas son fracciones de pantalla y no dependen del fov
    const alto = 2 * DISTANCIA * Math.tan(MathUtils.degToRad(camara.fov / 2));
    grupo.current?.scale.setScalar(alto);
  });

  const caja = useMemo(() => {
    const exterior = rectanguloIrregular(ANCHO_CAJA, ALTO_CAJA, 1, 7);
    return { exterior, interior: interiorDesigual(exterior, GROSOR, 7) };
  }, []);

  const barras = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => {
        const exterior = rectanguloIrregular(ANCHO_BARRA, ALTO_BARRA, 1, 20 + i);
        return {
          exterior,
          interior: interiorDesigual(exterior, GROSOR * 0.8, 20 + i),
          y: 0.22 - i * 0.118,
          // nada se alinea al eje, y cada barra tiene su propio desvío
          giro: MathUtils.degToRad(-5 + i * 1.7),
          x: -0.74 + i * 0.012,
        };
      }),
    [],
  );

  const [texturas, setTexturas] = useState<TexturaDeTexto[] | null>(null);

  useEffect(() => {
    let vigente = true;
    esperarFuente(FAMILIA_DISPLAY).then(() => {
      if (!vigente) return;
      setTexturas(etiquetas.map((e) => textoComoTextura(e.toUpperCase(), FAMILIA_DISPLAY)));
    });
    return () => {
      vigente = false;
    };
  }, [etiquetas]);

  useEffect(
    () => () => {
      for (const t of texturas ?? []) t.textura.dispose();
    },
    [texturas],
  );

  const saltarA = useCallback((indice: number) => {
    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    // al centro de la franja de esa parada, no a su borde
    window.scrollTo({
      top: (recorrido * (indice + 0.5)) / encuadres.length,
      behavior: "smooth",
    });
  }, []);

  // La entrada se relanza en cada corte de encuadre.
  useEffect(() => {
    const piezas = [pivoteCaja.current, ...pivotesBarra.current].filter(
      (p): p is Group => p !== null,
    );

    if (sinMovimiento()) {
      for (const p of piezas) p.scale.set(1, 1, 1);
      return;
    }

    const linea = gsap.timeline();

    if (pivoteCaja.current) {
      const { desdeX, desdeY, duracion, retardo, sobrepaso } = coreografia.caja;
      gsap.set(pivoteCaja.current.scale, { x: desdeX, y: desdeY });
      linea.to(
        pivoteCaja.current.scale,
        { x: 1, y: 1, duration: duracion / 1000, ease: `back.out(${sobrepaso})` },
        retardo / 1000,
      );
    }

    pivotesBarra.current.forEach((pivote, i) => {
      if (!pivote) return;
      const { desdeX, desdeY, duracion, sobrepaso } = coreografia.barra;
      gsap.set(pivote.scale, { x: desdeX, y: desdeY });
      linea.to(
        pivote.scale,
        { x: 1, y: 1, duration: duracion / 1000, ease: `back.out(${sobrepaso})` },
        retardoDeBarra(i, clave) / 1000,
      );
    });

    return () => {
      linea.kill();
    };
  }, [clave]);

  return createPortal(
    <group ref={grupo} position={[0, 0, -DISTANCIA]}>
      {barras.map((barra, i) => (
        // el grupo de fuera es el PIVOTE y va en el borde izquierdo; el de dentro
        // recoloca la forma. Escalar alrededor del centro mata el efecto: las
        // piezas tienen que crecer desde donde están ancladas
        <group key={barra.y} position={[barra.x, barra.y, 0]} rotation-z={barra.giro}>
          <group
            ref={(nodo) => {
              pivotesBarra.current[i] = nodo;
            }}
          >
            <group position={[ANCHO_BARRA / 2, 0, 0]}>
              <BarraMenu
                activa={i === clave}
                alPulsar={() => saltarA(i)}
                barra={{ ...barra, ancho: ANCHO_BARRA }}
                etiqueta={texturas?.[i] ?? null}
                orden={10 + i * 3}
              />
            </group>
          </group>
        </group>
      ))}

      <group position={[-0.21, -0.16, 0]} rotation-z={MathUtils.degToRad(-4)}>
        <group ref={pivoteCaja}>
          <group position={[ANCHO_CAJA / 2, 0, 0]}>
            <Recorte color={paleta.cremaLuz} orden={30} puntos={caja.exterior} />
            <Recorte color={paleta.tinta} orden={31} puntos={caja.interior} />
          </group>
        </group>
      </group>
    </group>,
    camara,
  );
}
