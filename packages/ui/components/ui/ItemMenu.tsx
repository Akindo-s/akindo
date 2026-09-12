/** @jsxImportSource nativewind */

import { View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Span } from "../html-elements";
import { Link } from "../link";

interface ItemMenuProps {
  /** Ícono de la izquierda. Recibe `size` y `color`. */
  Icono: React.ComponentType<{ className?: string; size?: number; color?: string }>;

  /** Texto principal del ítem. */
  label: string;

  /** Ruta a la que navega. */
  href: string;

  /** Separador inferior, para todos los ítems menos el último. */
  borde?: boolean;

  /** Clases extra para el contenedor. */
  className?: string;
}

/**
 * `ItemMenu` — fila de menú con ícono, etiqueta y flecha.
 *
 * `bloque`: el link tiene íconos y texto, así que en nativo va como Pressable
 * (regla 23). El color del ícono es explícito: en nativo `currentColor` sale
 * negro (text-stone-600 = #57534E).
 */
export function ItemMenu({ Icono, label, href, borde = false, className = "" }: ItemMenuProps) {
  return (
    <Link
      href={href}
      bloque
      className={twMerge(
        "flex flex-row items-center justify-between p-4 hover:bg-stone-50 transition",
        borde ? "border-b border-stone-100" : "",
        className
      )}
    >
      <View className="flex flex-row items-center gap-3">
        <View className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
          <Icono size={18} color="#57534E" />
        </View>
        <Span peso="semibold" className="text-stone-800 text-sm">{label}</Span>
      </View>
      <Span className="text-stone-400 text-lg leading-none">›</Span>
    </Link>
  );
}
