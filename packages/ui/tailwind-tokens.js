/**
 * Tokens de tipografia compartidos entre apps/web y apps/mobile.
 *
 * Existe porque la misma fuente se declara distinto en cada plataforma:
 *
 *   web    -> una familia ("Plus Jakarta Sans") + font-weight numerico
 *   nativo -> UNA FAMILIA POR PESO ("PlusJakartaSans_500Medium", ...),
 *             porque React Native ignora font-weight en fuentes custom
 *
 * Para que los componentes de packages/ui puedan escribir una sola clase que
 * funcione en las dos, cada config de Tailwind toma de aca su lado del mapa y
 * genera las mismas utilidades `font-jakarta-*`. Si cambia la fuente, se cambia
 * en este archivo y las dos apps siguen.
 *
 * CommonJS a proposito: lo consumen los tailwind.config.js de ambas apps.
 */

/**
 * Familia que registra `next/font` en apps/web. Se referencia por nombre y no
 * por la variable CSS (`var(--font-jakarta)`) porque nativewind parsea la
 * salida de Tailwind pensando en React Native, donde las variables CSS no
 * existen: si el valor es un `var(...)`, lo descarta y el componente se queda
 * con la fuente por defecto de react-native-web.
 *
 * `Plus Jakarta Sans Fallback` la genera el propio next/font para evitar el
 * salto de layout mientras baja la fuente real.
 */
const FAMILIA_WEB = ["Plus Jakarta Sans", "Plus Jakarta Sans Fallback"];

/** Fallbacks del sistema, ultimo recurso. */
const FALLBACK = ["system-ui", "sans-serif"];

/**
 * Peso semantico -> [nombre de familia en nativo, font-weight en web].
 * Los nombres nativos son los que registra @expo-google-fonts/plus-jakarta-sans;
 * tienen que coincidir exactamente con las claves que se pasan a `useFonts`.
 */
const PESOS = {
  extralight: ["PlusJakartaSans_200ExtraLight", "200"],
  light: ["PlusJakartaSans_300Light", "300"],
  normal: ["PlusJakartaSans_400Regular", "400"],
  medium: ["PlusJakartaSans_500Medium", "500"],
  semibold: ["PlusJakartaSans_600SemiBold", "600"],
  bold: ["PlusJakartaSans_700Bold", "700"],
};

/**
 * `fontFamily` de Tailwind para NATIVO: cada utilidad apunta a su propia
 * familia, que es la unica forma de que el peso se respete en React Native.
 */
function fontFamilyNativo() {
  const familias = { sans: [PESOS.normal[0]], jakarta: [PESOS.normal[0]] };
  for (const [nombre, [familia]] of Object.entries(PESOS)) {
    familias[`jakarta-${nombre}`] = [familia];
  }
  return familias;
}

/**
 * `fontFamily` de Tailwind para WEB.
 *
 * Se declaran las MISMAS utilidades `font-jakarta-*` que en nativo, aunque en
 * web todas apunten a la misma familia: asi los componentes de packages/ui
 * escriben una sola clase y no necesitan saber en que plataforma corren.
 *
 * Tiene que salir de `theme.fontFamily` y no de un plugin con `addUtilities`:
 * nativewind no pasa la clase al DOM, parsea la salida de Tailwind y la
 * convierte en objeto de estilo, y solo reconoce las familias declaradas aca.
 *
 * El peso en web lo pone la utilidad `font-<peso>` normal de Tailwind, que se
 * usa junto a esta (en nativo esa utilidad se ignora, y no molesta).
 */
function fontFamilyWeb() {
  const familias = {
    sans: [...FAMILIA_WEB, ...FALLBACK],
    jakarta: [...FAMILIA_WEB, ...FALLBACK],
  };
  for (const nombre of Object.keys(PESOS)) {
    familias[`jakarta-${nombre}`] = [...FAMILIA_WEB, ...FALLBACK];
  }
  return familias;
}

module.exports = {
  FAMILIA_WEB,
  PESOS,
  fontFamilyNativo,
  fontFamilyWeb,
};
