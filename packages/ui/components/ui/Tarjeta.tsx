/** @jsxImportSource nativewind */

import type { ReactNode } from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";

type VarianteTarjeta = "blanco" | "calido";

interface TarjetaProps {
  /** Contenido interno de la tarjeta. */
  children: ReactNode;

  /**
   * Variante de fondo predefinida.
   * - `"blanco"`: `bg-white` con borde sutil. Ideal para secciones de perfil cliente y formularios.
   * - `"calido"`: `bg-[#F3EBE0]` con borde crema. Ideal para dashboard distribuidor.
   * Si se provee `color`, esta prop se ignora.
   */
  variante?: VarianteTarjeta;

  /**
   * Color de fondo personalizado. Sobreescribe la `variante` si se provee.
   * @example color="#00ff99"
   */
  color?: string;

  /** Si incluir padding interno. Default: true. */
  conPadding?: boolean;

  /** Clases Tailwind adicionales para el contenedor raíz. */
  className?: string;
}

const varianteBg: Record<VarianteTarjeta, string> = {
  blanco: "bg-white border-stone-100 drop-shadow-sm",
  calido: "bg-[#F3EBE0] border-[#E8DEC1]",
};

/**
 * `Tarjeta` — Contenedor de sección con borde redondeado y fondo configurable.
 *
 * twMerge en vez de concatenar: el `className` de la instancia tiene que poder
 * pisar el padding o el fondo de la variante igual en las dos plataformas (ver
 * regla 41 de dev-docs/migracion-progreso.md).
 */
export function Tarjeta({
  children,
  variante = "blanco",
  color,
  conPadding = true,
  className = "",
}: TarjetaProps) {
  const bgClasses = color ? "" : varianteBg[variante];

  return (
    <View
      style={color ? { backgroundColor: color } : undefined}
      className={twMerge("rounded-2xl border", bgClasses, conPadding ? "p-5" : "", className)}
    >
      {children}
    </View>
  );
}
