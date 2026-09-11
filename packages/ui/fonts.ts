import { Platform, type TextStyle } from "react-native";
// El mapa de pesos vive en tailwind-tokens.js porque tambien lo consumen los
// tailwind.config.js de las dos apps, que son CommonJS y no pueden leer un .ts.
// Este modulo es la cara runtime del mismo mapa.

/**
 * Pesos disponibles. Se escribe como union literal y no se deriva del mapa
 * porque tailwind-tokens.js es JS: al tiparlo como Record<string, ...> el
 * `keyof` colapsaba a `string` y un peso mal escrito pasaba el typecheck.
 * Si agregas un peso, va en los dos lados (ver COMPONENTES-MULTIPLATAFORMA.md).
 */
export type PesoFuente =
  | "extralight"
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold";

const tokens = require("./tailwind-tokens") as {
  FAMILIA_WEB: string[];
  PESOS: Record<PesoFuente, [string, string]>;
};

type EstiloFuente = Pick<TextStyle, "fontFamily" | "fontWeight">;

/**
 * Devuelve el estilo de tipografia correcto para la plataforma actual.
 *
 * Hace falta porque la fuente se declara distinto en cada una:
 *
 *   web    -> una sola familia ("Plus Jakarta Sans") + fontWeight numerico
 *   nativo -> una familia POR PESO ("PlusJakartaSans_500Medium"), porque
 *             React Native ignora fontWeight en fuentes custom
 *
 * Va por el prop `style` y no por `className` a proposito: los componentes de
 * texto tienen `cssInterop` registrado, que convierte className en estilos de
 * react-native-web y en el camino descarta la familia. El `style` es el unico
 * canal que respetan las dos plataformas.
 *
 * @example
 * <H2 style={fuente("semibold")}>Iniciar Sesion</H2>
 * <P style={fuente()}>Texto normal</P>
 */
export function fuente(peso: PesoFuente = "normal"): EstiloFuente {
  const entrada = tokens.PESOS[peso] ?? tokens.PESOS.normal;
  const [familiaNativa, pesoNumerico] = entrada;

  if (Platform.OS === "web") {
    return {
      // La pila completa, igual que la que pone next/font en el <html>: con
      // solo la primera familia, los glifos que no trae el subset latino de
      // Jakarta (una flecha "→", por ejemplo) caian a la fuente por defecto
      // del navegador en vez de a "Plus Jakarta Sans Fallback".
      fontFamily: tokens.FAMILIA_WEB.map((familia) => `"${familia}"`).join(", "),
      fontWeight: pesoNumerico as TextStyle["fontWeight"],
    };
  }
  return { fontFamily: familiaNativa };
}
