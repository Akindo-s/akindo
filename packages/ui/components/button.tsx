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

  /** Ícono a mostrar a la izquierda del texto. Acepta cualquier ComponentType con className. */
  Icono?: React.ComponentType<{ className?: string; size?: number }> | null;

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

const variantes: Record<NonNullable<BotonProps["variante"]>, string> = {
  primario:
    " bg-[#DAA520] hover:bg-[var(--color-primary-600)] text-white w-full py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition cursor-pointer uppercase text-sm tracking-wide disabled:opacity-75",
  secundario:
    "bg-transparent hover:bg-[#FCEAD2] text-[#4F4634] rounded-xl font-medium transition border-none py-3 shadow-none cursor-pointer",
  peligro:
    "text-red-600 font-medium text-sm px-6 py-2 border border-red-200 rounded-full hover:bg-red-50 transition cursor-pointer",
  chip: "flex items-center gap-2 bg-transparent border border-[#E8DEC1] text-stone-800 px-4 py-2.5 rounded-full font-medium text-xs whitespace-nowrap hover:bg-stone-50 transition cursor-pointer",
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

  const baseClasses = `${variantes[variante]} flex flex-row items-center justify-center gap-2 h-fit w-fit px-2 ${className}`;

  const content = (
    <>
      {Icono && <Icono className="flex-shrink-0" size={size} />}
      <Text style={fuente("medium")}>

      {loading ? loadingText : children}
      </Text>
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
