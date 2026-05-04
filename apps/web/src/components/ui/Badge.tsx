import { ReactNode } from "react";

type VarianteBadge = "oro" | "exito" | "error" | "neutro" | "advertencia";

interface BadgeProps {
  /** Contenido del badge (texto, número, etc). */
  children: ReactNode;

  /**
   * Variante de color predefinida.
   * - `"oro"`: amarillo/dorado — para niveles premium, estados positivos.
   * - `"exito"`: verde — para estados "en stock", verificado, activo.
   * - `"error"`: rojo — para estados "sin stock", errores, alertas críticas.
   * - `"advertencia"`: naranja/ámbar — para bajo stock, precaución.
   * - `"neutro"`: gris — para información neutral (ej. "Miembro desde 2021").
   */
  variante?: VarianteBadge;

  /**
   * Color de texto y borde personalizado en formato CSS.
   * Si se provee `colorCustom`, se ignora `variante`.
   * Requiere también `bgCustom`.
   */
  colorCustom?: string;

  /** Color de fondo personalizado en formato CSS. Requiere también `colorCustom`. */
  bgCustom?: string;

  /** Clases Tailwind adicionales para el contenedor del badge. */
  className?: string;
}

const varianteClasses: Record<VarianteBadge, string> = {
  oro: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  exito: "bg-green-100 text-green-800 border border-green-200",
  error: "bg-red-100 text-red-800 border border-red-200",
  advertencia: "bg-orange-100 text-orange-800 border border-orange-200",
  neutro: "bg-stone-100 text-stone-600 border border-stone-200",
};

/**
 * `Badge` — Etiqueta/chip de estado o categoría.
 *
 * Estandariza los chips de estado a lo largo de la app: niveles de usuario,
 * estados de stock, categorías, etc. Soporta variantes predefinidas y colores
 * completamente custom.
 *
 * @example
 * // Badge de nivel premium:
 * <Badge variante="oro">✓ Nivel Premium</Badge>
 *
 * @example
 * // Badge de stock:
 * <Badge variante="exito">In Stock (45)</Badge>
 * <Badge variante="error">Out of Stock</Badge>
 *
 * @example
 * // Badge neutro:
 * <Badge variante="neutro">Miembro desde 2021</Badge>
 *
 * @example
 * // Badge con colores custom:
 * <Badge colorCustom="#1a237e" bgCustom="#e8eaf6">Exclusivo</Badge>
 */
export function Badge({
  children,
  variante = "neutro",
  colorCustom,
  bgCustom,
  className = "",
}: BadgeProps) {
  const isCustom = colorCustom && bgCustom;

  const customStyle = isCustom
    ? { color: colorCustom, backgroundColor: bgCustom, borderColor: colorCustom + "33" }
    : undefined;

  return (
    <span
      style={customStyle}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
        isCustom ? "border" : varianteClasses[variante]
      } ${className}`}
    >
      {children}
    </span>
  );
}
