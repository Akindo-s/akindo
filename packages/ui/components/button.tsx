/** @jsxImportSource nativewind */
import { Text } from "react-native";
import { fuente } from "../fonts";
import { Pressable } from "./html-elements";
import {Link} from "./link";

/**
 * Las props se declaran explícitamente en vez de extender
 * `ButtonHTMLAttributes<HTMLButtonElement>`: eso arrastraba ~280 props que solo
 * existen en el DOM (`onBlur`, `form`, `formAction`, los handlers con tipos de
 * evento de React DOM) y después se spreadeaban sobre un `Pressable` de React
 * Native, que no las entiende. Acá solo vive lo que funciona en las dos
 * plataformas.
 */
interface BotonProps {
  /**
   * Variante visual del botón.
   * - `"primario"`: botón grande dorado, usado en formularios (submit/action principal).
   * - `"secundario"`: botón de fondo crema, útil para acciones secundarias o de regreso.
   * - `"peligro"`: borde rojo, para acciones destructivas como cerrar sesión.
   * - `"chip"`: pastilla pequeña de borde, usada en las barras de acción (ej. dashboard distribuidor).
   */
  variante?: "primario" | "secundario" | "peligro" | "chip";

  /** Ícono a mostrar a la izquierda del texto. Recibe `size` y el `color` de la variante. */
  Icono?: React.ComponentType<{ className?: string; size?: number; color?: string }> | null;

  /** Tamaño del ícono en px. Default: 16 para chip, 18 para secundario, 20 para primario. */
  iconoSize?: number;

  /** Texto del botón. Si se omite y solo hay Icono, el botón será solo ícono. */
  children?: React.ReactNode;

  /** Si se provee href, el botón se renderiza como un <Link> de Next.js en lugar de <button>. */
  href?: string;

  /** Muestra un estado de carga (spinner de texto) y deshabilita el botón. */
  loading?: boolean;

  /** Texto a mostrar cuando loading=true. Default: "Cargando..." */
  loadingText?: string;

  /** Clases Tailwind adicionales para personalizar el componente por instancia. */
  className?: string;

  /** Deshabilita el botón. `loading` también lo deshabilita por su cuenta. */
  disabled?: boolean;

  /**
   * Se dispara al activar el botón: click en web, press en nativo.
   *
   * No recibe el evento. El evento de RN (`GestureResponderEvent`) y el del DOM
   * (`MouseEvent`) no son compatibles, así que exponer uno sería mentirle a una
   * de las dos plataformas. Si necesitás el evento, usá `Pressable` directo.
   */
  onClick?: () => void;

  /** Etiqueta para lectores de pantalla cuando el botón es solo ícono. */
  accessibilityLabel?: string;
}

/**
 * Clases por variante, partidas en contenedor y texto.
 *
 * En web el `<button>` original le pasaba color, tamaño y mayúsculas al texto
 * por herencia de CSS. En React Native (y en react-native-web) un `Text` no
 * hereda nada de su `View` padre, así que las clases de texto tienen que ir en
 * el `Text` mismo.
 *
 * Con los íconos pasa lo mismo: en web tomaban el color del botón por
 * `currentColor`, pero en nativo `currentColor` sale negro. Por eso cada
 * variante tiene su color de ícono explícito (el mismo hex que su texto).
 *
 * El peso (`font-medium` en el original) va por `fuente("medium")`, no acá.
 */
const variantes: Record<NonNullable<BotonProps["variante"]>, { contenedor: string; texto: string; icono: string }> = {
  primario: {
    contenedor:
      "bg-[#DAA520] hover:bg-[#C1901D] text-white w-full py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-75",
    texto: "text-white uppercase text-sm tracking-wide",
    icono: "#FFFFFF",
  },
  secundario: {
    contenedor:
      "bg-transparent hover:bg-[#FCEAD2] text-[#4F4634] rounded-xl transition border-none py-3 shadow-none cursor-pointer",
    texto: "text-[#4F4634]",
    icono: "#4F4634",
  },
  peligro: {
    contenedor:
      "text-red-600 px-6 py-2 border border-red-200 rounded-full hover:bg-red-50 transition cursor-pointer",
    texto: "text-red-600 text-sm",
    icono: "#DC2626", // text-red-600
  },
  chip: {
    contenedor:
      "flex items-center gap-2 bg-transparent border border-[#E8DEC1] text-stone-800 px-4 py-2.5 rounded-full hover:bg-stone-50 transition cursor-pointer",
    texto: "text-stone-800 text-xs whitespace-nowrap",
    icono: "#292524", // text-stone-800
  },
};

/**
 * `Boton` — Componente de botón unificado para toda la app.
 *
 * Soporta botones de formulario grandes (variante `"primario"`), botones secundarios
 * con ícono (variante `"secundario"`), acciones destructivas (`"peligro"`) y chips
 * de acción rápida (`"chip"`).
 *
 * No acepta `type="submit"`: se renderiza como `Pressable`, no como `<button>`,
 * así que no existe el submit nativo de formularios en ninguna de las dos
 * plataformas. La acción se conecta siempre por `onClick`.
 *
 * @example
 * // Botón de submit en formulario:
 * <Boton variante="primario" onClick={handleSubmit} loading={loading} loadingText="Guardando...">
 *   Registrarse
 * </Boton>
 *
 * @example
 * // Botón de regreso con ícono:
 * <Boton variante="secundario" Icono={ArrowBackIcon} onClick={handleBack} className="w-10 h-10 p-0" />
 *
 * @example
 * // Chip de acción en dashboard:
 * <Boton variante="chip" Icono={PlusCircle} href="/distribuidor/productos/nuevo">
 *   Nuevo producto
 * </Boton>
 *
 * @example
 * // Botón de cerrar sesión:
 * <Boton variante="peligro" onClick={handleLogout}>Cerrar sesión</Boton>
 */
export function Boton({
  variante = "primario",
  Icono = null,
  iconoSize,
  children,
  href,
  loading = false,
  loadingText = "Cargando...",
  className = "",
  disabled = false,
  onClick,
  accessibilityLabel,
}: BotonProps) {
  const defaultIconSize =
    variante === "chip" ? 16 : variante === "secundario" ? 18 : 20;
  const size = iconoSize ?? defaultIconSize;

  const baseClasses = `${variantes[variante].contenedor} flex flex-row items-center justify-center gap-2 h-fit w-fit px-2 ${className}`;
  const texto = loading ? loadingText : children;

  const content = (
    <>
      {Icono && <Icono className="flex-shrink-0" size={size} color={variantes[variante].icono} />}
      {/* Sin texto no se renderiza el Text: vacío igual ocupaba lugar y el
          `gap-2` descentraba los botones de solo ícono. */}
      {texto != null && texto !== false && (
        <Text style={fuente("medium")} className={variantes[variante].texto}>
          {texto}
        </Text>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      disabled={loading || disabled}
      className={baseClasses}
      onPress={() => onClick?.()}
    >
      {content}
    </Pressable>
  );
}
