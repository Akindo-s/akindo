import Link from "next/link";

interface ItemMenuProps {
  /** Ícono a mostrar a la izquierda. Acepta cualquier ComponentType con className y size. */
  Icono: React.ComponentType<{ className?: string; size?: number }>;

  /** Texto principal del ítem. */
  label: string;

  /** Ruta de Next.js a la que navega el ítem al hacer clic. */
  href: string;

  /** Si true, dibuja un separador inferior (border-b). Útil para todos los ítems excepto el último. */
  borde?: boolean;

  /** Clases Tailwind adicionales para el contenedor del ítem. */
  className?: string;
}

/**
 * `ItemMenu` — Fila de menú con ícono, etiqueta y flecha de navegación.
 *
 * Estandariza las filas de menú de ajustes/navegación interna.
 * Siempre navega a una ruta via `<Link>`.
 *
 * @example
 * <Tarjeta conPadding={false} className="overflow-hidden flex flex-col">
 *   <ItemMenu Icono={List} label="Mis pedidos" href="/pedidos" borde />
 *   <ItemMenu Icono={Settings} label="Ajustes" href="/ajustes" borde />
 *   <ItemMenu Icono={HelpCircle} label="Centro de ayuda" href="/ayuda" />
 * </Tarjeta>
 */
export function ItemMenu({ Icono, label, href, borde = false, className = "" }: ItemMenuProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between p-4 hover:bg-stone-50 transition text-left ${
        borde ? "border-b border-stone-100" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center flex-shrink-0">
          <Icono size={18} />
        </div>
        <span className="font-semibold text-stone-800 text-sm">{label}</span>
      </div>
      <span className="text-stone-400 text-lg leading-none">›</span>
    </Link>
  );
}
