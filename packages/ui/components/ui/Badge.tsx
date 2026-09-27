/** @jsxImportSource nativewind */

import type { ReactNode } from "react";
import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Span } from "../html-elements";

type VarianteBadge = "oro" | "exito" | "error" | "neutro" | "advertencia";

interface BadgeProps {
  /** Contenido del badge. Si es texto suelto se pinta con el color de la variante. */
  children: ReactNode;

  /**
   * Variante de color predefinida.
   * - `"oro"`: amarillo/dorado — niveles premium, estados positivos.
   * - `"exito"`: verde — en stock, verificado, activo.
   * - `"error"`: rojo — sin stock, errores.
   * - `"advertencia"`: naranja/ámbar — bajo stock, precaución.
   * - `"neutro"`: gris — información neutral.
   */
  variante?: VarianteBadge;

  /** Color de texto y borde custom. Ignora la `variante`. Requiere `bgCustom`. */
  colorCustom?: string;

  /** Color de fondo custom. Requiere `colorCustom`. */
  bgCustom?: string;

  /** Clases extra para el contenedor. */
  className?: string;

  /** Clases extra para el texto (tamaño, transformación). */
  claseTexto?: string;

  /** Peso del texto: en nativo es otra familia y no se cambia con el className. */
  peso?: "medium" | "semibold" | "bold";
}

/** Por variante: contenedor (fondo y borde) y texto, que en RN no hereda color. */
const varianteClases: Record<VarianteBadge, { contenedor: string; texto: string }> = {
  oro: { contenedor: "bg-yellow-100 border border-yellow-200", texto: "text-yellow-800" },
  exito: { contenedor: "bg-green-100 border border-green-200", texto: "text-green-800" },
  error: { contenedor: "bg-red-100 border border-red-200", texto: "text-red-800" },
  advertencia: { contenedor: "bg-orange-100 border border-orange-200", texto: "text-orange-800" },
  neutro: { contenedor: "bg-stone-100 border border-stone-200", texto: "text-stone-600" },
};

/**
 * `Badge` — etiqueta/chip de estado o categoría.
 *
 * El original era un `<span>` que le daba color al texto por herencia; acá el
 * color va en el `Span` de adentro (regla 3). Si `children` es texto, se
 * envuelve solo; si es un nodo, se pinta tal cual.
 */
export function Badge({
  children,
  variante = "neutro",
  colorCustom,
  bgCustom,
  className = "",
  claseTexto = "",
  peso = "medium",
}: BadgeProps) {
  const custom = colorCustom && bgCustom;
  const { contenedor, texto } = varianteClases[variante];

  return (
    <View
      style={custom ? { backgroundColor: bgCustom, borderColor: colorCustom + "33" } : undefined}
      className={twMerge(
        "flex flex-row items-center gap-1 px-3 py-1 rounded-full self-start",
        custom ? "border" : contenedor,
        className
      )}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Span
          peso={peso}
          style={custom ? { color: colorCustom } : undefined}
          className={twMerge("text-xs", custom ? "" : texto, claseTexto)}
        >
          {children}
        </Span>
      ) : (
        children
      )}
    </View>
  );
}
