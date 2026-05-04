import { ReactNode } from "react";

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
   * Color de fondo personalizado en cualquier formato CSS válido (hex, rgb, hsl).
   * Sobreescribe la `variante` si se provee.
   * @example color="#00ff99"
   */
  color?: string;

  /** Si incluir padding interno. Default: true. Desactívalo si el contenido tiene su propio padding (ej. listas). */
  conPadding?: boolean;

  /** Clases Tailwind adicionales para el contenedor raíz. */
  className?: string;
}

const varianteBg: Record<VarianteTarjeta, string> = {
  blanco: "bg-white border-stone-100 shadow-sm",
  calido: "bg-[#F3EBE0] border-[#E8DEC1]",
};

/**
 * `Tarjeta` — Contenedor de sección con borde redondeado y fondo configurable.
 *
 * Estandariza el look de las tarjetas a lo largo de la app.
 * Soporta dos variantes predefinidas (`blanco` y `calido`) o un color completamente custom.
 *
 * @example
 * // Tarjeta blanca estándar:
 * <Tarjeta className="mb-6">
 *   <h3>Información de contacto</h3>
 * </Tarjeta>
 *
 * @example
 * // Tarjeta de tono cálido para distribuidor:
 * <Tarjeta variante="calido">
 *   <p>VOLUMEN BRUTO</p>
 * </Tarjeta>
 *
 * @example
 * // Tarjeta con color personalizado:
 * <Tarjeta color="#e0f7fa">
 *   <p>Contenido especial</p>
 * </Tarjeta>
 *
 * @example
 * // Sin padding interno (para listas):
 * <Tarjeta conPadding={false} className="overflow-hidden">
 *   <ItemMenu ... />
 * </Tarjeta>
 */
export function Tarjeta({
  children,
  variante = "blanco",
  color,
  conPadding = true,
  className = "",
}: TarjetaProps) {
  const bgClasses = color ? "" : varianteBg[variante];
  const inlineStyle = color ? { backgroundColor: color } : undefined;

  return (
    <div
      style={inlineStyle}
      className={`rounded-2xl border ${bgClasses} ${conPadding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
