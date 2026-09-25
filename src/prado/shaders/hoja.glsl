// Forma y movimiento de una hoja. Lo comparten el pasto, los tallos y las cabezas de los dientes de
// león: la cabeza recalcula la punta de su tallo con esta misma función, por eso lo sigue exacto.
uniform mat4 u_vistaProy;
uniform vec3 u_camara;
uniform float u_tiempo;      // tiempo propio del prado (ya escalado por el movimiento)
uniform vec2 u_rafaga;       // x: fuerza 0..1; y: frente en x de pantalla (0..1, sale de rango)
uniform float u_extra;       // influencia del visitante, ya acotada
uniform vec4 u_puntero;      // x, z en el suelo; radio; fuerza (0 sin puntero)
uniform vec3 u_viento;       // escala del ruido, fuerza del ruido, fuerza de la ráfaga
uniform float u_movimiento;  // 1 normal, 0.15 con reduced motion
uniform float u_torsion;

float empujeViento(vec2 raiz) {
  float t = u_tiempo;
  float ruido = snoise(vec3(raiz * u_viento.x, t * 0.12)) * 0.65
              + snoise(vec3(raiz * u_viento.x * 3.1, t * 0.35)) * 0.25;
  vec4 clip = u_vistaProy * vec4(raiz.x, 0.0, raiz.y, 1.0);
  float xPantalla = clip.x / clip.w * 0.5 + 0.5;
  // la ráfaga cruza la pantalla de izquierda a derecha como una ola (x*x: pow es indefinido con base negativa)
  float dx = (xPantalla - u_rafaga.y) / 0.2;
  float ola = exp(-dx * dx) * u_rafaga.x;
  return (ruido * u_viento.y + ola * (u_viento.z + u_extra)) * u_movimiento
       + 0.04 * sin(t * 0.35 - raiz.x * 0.4);
}

// raiz = (x, z, altura, ancho); forma = (curva, orientación, tono, fase); v de 0 (raíz) a 1 (punta)
vec3 posicionHoja(vec4 raiz, vec4 forma, float v, float lado, out vec3 normal, out float viento) {
  vec2 base = raiz.xy;
  float altura = raiz.z;
  float orient = forma.y;
  vec2 dirViento = normalize(vec2(1.0, -0.25));
  vec2 dirInclina = vec2(cos(orient), sin(orient));
  viento = empujeViento(base);

  // el puntero aparta el pasto hacia afuera
  vec2 aPuntero = base - u_puntero.xy;
  float dP = length(aPuntero);
  float empuje = u_puntero.w * (1.0 - smoothstep(0.0, u_puntero.z, dP));
  vec2 dirEmpuje = dP > 1e-4 ? aPuntero / dP : vec2(0.0);

  vec2 flexion = dirInclina * forma.x + dirViento * viento + dirEmpuje * empuje * 0.9;
  float angulo = length(flexion);
  vec2 dirFlexion = angulo > 1e-4 ? flexion / angulo : dirInclina;
  float a = angulo * v * 1.1;
  float horizontal = altura * v * sin(a) * 0.9;
  float vertical = altura * v * cos(a);

  // temblor fino de la punta, cada hoja con su fase
  float temblor = sin(u_tiempo * 2.3 + forma.w * 6.2831) * 0.015 * v * v * altura;
  vec2 lateral = vec2(-dirFlexion.y, dirFlexion.x);

  float giro = orient + 1.5708 + u_torsion * (forma.w - 0.5) * v;
  vec2 ejeAncho = vec2(cos(giro), sin(giro));
  float grosor = raiz.w * pow(1.0 - v, 0.9);

  vec3 p = vec3(base.x, 0.0, base.y)
         + vec3(dirFlexion.x, 0.0, dirFlexion.y) * horizontal
         + vec3(lateral.x, 0.0, lateral.y) * temblor
         + vec3(0.0, vertical, 0.0)
         + vec3(ejeAncho.x, 0.0, ejeAncho.y) * grosor * lado;

  vec3 tangente = normalize(vec3(dirFlexion.x * sin(a), cos(a), dirFlexion.y * sin(a)));
  normal = normalize(cross(tangente, vec3(ejeAncho.x, 0.0, ejeAncho.y)));
  return p;
}
