"use client";

import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
}

const variantes: Record<NonNullable<BotonProps["variante"]>, string> = {
  primario:
    " bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white w-full py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition cursor-pointer uppercase text-sm tracking-wide disabled:opacity-75",
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
 * @example
 * // Botón de submit en formulario:
 * <Boton variante="primario" type="submit" loading={loading} loadingText="Guardando...">
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
  ...props
}: BotonProps) {
  const defaultIconSize =
    variante === "chip" ? 16 : variante === "secundario" ? 18 : 20;
  const size = iconoSize ?? defaultIconSize;

  const baseClasses = `${variantes[variante]} flex flex-row items-center justify-center gap-2 h-fit w-fit px-2 ${className}`;

  const content = (
    <>
      {Icono && <Icono className="flex-shrink-0" size={size} />}
      {loading ? loadingText : children}
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
    <button disabled={loading || props.disabled} className={baseClasses} {...props}>
      {content}
    </button>
  );
}
