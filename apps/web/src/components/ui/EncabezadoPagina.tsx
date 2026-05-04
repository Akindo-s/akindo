import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EncabezadoPaginaProps {
  /** Título centrado que aparece en el encabezado. */
  titulo: string;

  /**
   * URL a la que navega el botón de regreso.
   * Si se omite, no se muestra el botón de regreso.
   */
  href?: string;

  /**
   * Callback alternativo al href para el botón de regreso.
   * Si se provee `href`, se usa `<Link>`. Si se provee `onClick`, se usa `<button>`.
   * `href` tiene prioridad sobre `onClick`.
   */
  onClick?: () => void;

  /**
   * Elemento a renderizar en el lado derecho del encabezado (ej. botón de opciones ⋮).
   * Si se omite, se coloca un espaciador invisible para mantener el título centrado.
   */
  accionDerecha?: React.ReactNode;

  /** Clases Tailwind adicionales para el contenedor `<header>`. */
  className?: string;
}

/**
 * `EncabezadoPagina` — Barra de encabezado de página con botón de regreso opcional y título centrado.
 *
 * Estandariza el header de las páginas internas (Perfil, Detalle de producto, etc.).
 * El título siempre está centrado. Opcionalmente acepta una acción en el lado derecho.
 *
 * @example
 * // Encabezado con Link de regreso:
 * <EncabezadoPagina titulo="Perfil" href="/" />
 *
 * @example
 * // Encabezado con callback (ej. entre pasos de un form):
 * <EncabezadoPagina titulo="Datos de negocio" onClick={handleBack} />
 *
 * @example
 * // Encabezado con acción a la derecha:
 * <EncabezadoPagina
 *   titulo="Administración"
 *   href="/"
 *   accionDerecha={<button><MoreVertical size={24} /></button>}
 * />
 */
export function EncabezadoPagina({
  titulo,
  href,
  onClick,
  accionDerecha,
  className = "",
}: EncabezadoPaginaProps) {
  const botonRegreso = href ? (
    <Link href={href} className="text-stone-800 cursor-pointer">
      <ArrowLeft size={24} />
    </Link>
  ) : onClick ? (
    <button onClick={onClick} className="text-stone-800 cursor-pointer">
      <ArrowLeft size={24} />
    </button>
  ) : (
    <div className="w-6" /> // espaciador para mantener titulo centrado
  );

  return (
    <header
      className={`flex items-center justify-between p-4 relative ${className}`}
    >
      {botonRegreso}
      <h1 className="text-sm font-bold tracking-widest text-stone-900 uppercase absolute left-1/2 -translate-x-1/2">
        {titulo}
      </h1>
      {accionDerecha ?? <div className="w-6" />}
    </header>
  );
}
