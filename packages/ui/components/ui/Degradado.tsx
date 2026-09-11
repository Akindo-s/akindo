/** @jsxImportSource nativewind */

import { useId } from "react";
import { View } from "react-native";
import { Defs, LinearGradient, Rect, Stop, Svg } from "../html-elements";

export interface ParadaDegradado {
  offset: number;
  color: string;
  opacity?: number;
}

const DIRECCIONES = {
  // bg-gradient-to-t: de abajo hacia arriba.
  "to-t": { x1: "0", y1: "1", x2: "0", y2: "0" },
  // bg-gradient-to-br: de arriba-izquierda a abajo-derecha.
  "to-br": { x1: "0", y1: "0", x2: "1", y2: "1" },
} as const;

/**
 * Capa `absolute inset-0` con un degradado lineal. Reemplaza a
 * `bg-gradient-to-* from-* via-* to-*`: React Native no tiene `linear-gradient`
 * en CSS, así que se dibuja con SVG. Va dentro de un View porque el className
 * de un Svg no llega al DOM en web.
 */
export function Degradado({ direccion, paradas }: { direccion: keyof typeof DIRECCIONES; paradas: ParadaDegradado[] }) {
  // useId trae caracteres que no sirven en un `url(#...)` de SVG.
  const id = `degradado${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <View className="absolute inset-0 pointer-events-none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} {...DIRECCIONES[direccion]}>
            {paradas.map(({ offset, color, opacity = 1 }) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
