// Forma y movimiento de una hoja. Lo comparten el pasto, los tallos y las cabezas de los dientes de
// león: la cabeza recalcula la punta de su tallo con esta misma función, por eso lo sigue exacto.
uniform mat4 u_vistaProy;
uniform vec3 u_camara;
uniform float u_tiempo;      // tiempo propio del prado (ya escalado por el movimiento)
uniform vec2 u_rafaga;       // x: fuerza 0..1; y: frente en x de pantalla (0..1, sale de rango)
uniform float u_extra;       // influencia del visitante, ya acotada
uniform vec4 u_puntero;      // x, z bajo el cursor; radio; fuerza (0 sin puntero)
uniform vec4 u_rastro[12];   // estela del cursor: x, z y empuje (dirección × fuerza)
uniform vec3 u_viento;       // escala del ruido, fuerza del ruido, fuerza de la ráfaga
uniform float u_movimiento;  // 1 normal, 0.15 con reduced motion
uniform float u_torsion;

float empujeViento(vec2 raiz) {
  float t = u_tiempo;
  vec2 dir = normalize(vec2(1.0, -0.25));
  // la brisa viaja con el viento: parches que recorren el prado, no ruido que hierve en su lugar
  vec2 arrastre = raiz - dir * t * 1.8;
  float brisa = snoise(vec3(arrastre * u_viento.x, t * 0.04)) * 0.7
              + snoise(vec3(arrastre * u_viento.x * 2.7, t * 0.09)) * 0.3;
  // la ráfaga es un frente que avanza por el prado (en el espacio, con parallax): cruza rápido el
  // pasto cercano y despacio el lejano, y llega en diagonal
  float s = dot(raiz, dir);
  float frente = mix(-28.0, 28.0, (u_rafaga.y + 0.3) / 1.6);
  float dx = (s - frente) / 6.0;
  float ola = exp(-dx * dx) * u_rafaga.x;
  return (brisa * u_viento.y + ola * (u_viento.z + u_extra)) * u_movimiento
       + 0.03 * sin(t * 0.35 - raiz.x * 0.4);
}

// Como pasar la mano por el pasto: cada muestra de la estela inclina las hojas cercanas en la
// dirección en que se movió el cursor. El radio crece con la distancia para que en pantalla se vea
// parecido cerca y lejos.
vec2 empujeRastro(vec2 base) {
  vec2 total = vec2(0.0);
  for (int i = 0; i < 12; i++) {
    vec4 m = u_rastro[i];
    vec2 d = base - m.xy;
    float radio = 0.35 + 0.035 * length(m.xy - u_camara.xz);
    total += m.zw * exp(-dot(d, d) / (radio * radio));
  }
  float l = length(total);
  return l > 1.0 ? total / l : total;
}

// raiz = (x, z, altura, ancho); forma = (curva, orientación, tono, fase); v de 0 (raíz) a 1 (punta)
vec3 posicionHoja(vec4 raiz, vec4 forma, float v, float lado, out vec3 normal, out float viento) {
  vec2 base = raiz.xy;
  float altura = raiz.z;
  float orient = forma.y;
  vec2 dirViento = normalize(vec2(1.0, -0.25));
  vec2 dirInclina = vec2(cos(orient), sin(orient));
  viento = empujeViento(base);

  // con el cursor quieto el pasto apenas se abre a su alrededor
  vec2 aPuntero = base - u_puntero.xy;
  float dP = length(aPuntero);
  float abierto = u_puntero.w * exp(-(dP * dP) / (u_puntero.z * u_puntero.z));
  vec2 dirAbierto = dP > 1e-4 ? aPuntero / dP : vec2(0.0);

  // los tallos de diente de león son más rígidos que el pasto: el viento los mece, no los dobla,
  // y la mano no los mueve: al pasar el cursor solo se aparta el pasto
  bool esTallo = forma.z > 1.5;
  float rigidez = esTallo ? 0.35 : 1.0;
  vec2 mano = esTallo ? vec2(0.0) : (empujeRastro(base) * 0.35 + dirAbierto * abierto * 0.1) * u_movimiento;
  vec2 flexion = dirInclina * forma.x + dirViento * viento * rigidez + mano;
  float largo = length(flexion);
  vec2 dirFlexion = largo > 1e-4 ? flexion / largo : dirInclina;
  float angulo = min(largo, 1.2);  // ninguna hoja se dobla más de ~70°: no se meten bajo el suelo
  float a = angulo * v * 1.1;
  float horizontal = altura * v * sin(a) * 0.9;
  float vertical = altura * v * cos(a);

  // temblor fino de la punta, cada hoja con su fase
  float temblor = sin(u_tiempo * 2.3 + forma.w * 6.2831) * 0.015 * v * v * altura;
  vec2 lateral = vec2(-dirFlexion.y, dirFlexion.x);

  vec3 tangente = normalize(vec3(dirFlexion.x * sin(a), cos(a), dirFlexion.y * sin(a)));
  vec3 centro = vec3(base.x, 0.0, base.y)
              + vec3(dirFlexion.x, 0.0, dirFlexion.y) * horizontal
              + vec3(lateral.x, 0.0, lateral.y) * temblor
              + vec3(0.0, vertical, 0.0);

  if (esTallo) {
    // un tallo es un tubo: grosor parejo, sin torsión y siempre de frente a la cámara; la normal
    // gira de un borde al otro para que la luz lo redondee
    vec3 vista = normalize(u_camara - centro);
    vec3 eje = normalize(cross(tangente, vista));
    normal = normalize(vista * sqrt(max(0.0, 1.0 - lado * lado)) + eje * lado);
    return centro + eje * raiz.w * (1.0 - 0.15 * v) * lado;
  }

  float giro = orient + 1.5708 + u_torsion * (forma.w - 0.5) * v;
  vec2 ejeAncho = vec2(cos(giro), sin(giro));
  float grosor = raiz.w * pow(1.0 - v, 0.9);
  vec3 p = centro + vec3(ejeAncho.x, 0.0, ejeAncho.y) * grosor * lado;
  normal = normalize(cross(tangente, vec3(ejeAncho.x, 0.0, ejeAncho.y)));
  return p;
}
