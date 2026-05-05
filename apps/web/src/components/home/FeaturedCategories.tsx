import Link from "next/link";
import { MachineryIcon, PackagingIcon, ArtsAndCraftsIcon } from "../icons/CategoriesIcons";
import { obtenerCategoriasDestacadas } from "@/lib/api/categorias";

interface CategoryCardProps {
  label: string;
  slug: string;
  imageSrc?: string;
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "Equipo Industrial": MachineryIcon,
  "Materiales de Embalaje": PackagingIcon,
  "Artesanías": ArtsAndCraftsIcon,
};

function CategoryCard({ label, slug, imageSrc, Icon }: CategoryCardProps) {
  return (
    <Link
      href={`/mercado/productos?categoria=${slug}`}
      className="relative flex flex-col justify-end w-full aspect-square rounded-2xl overflow-hidden group transition-all hover:shadow-lg active:scale-[0.98] select-none"
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-stone-100">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={label}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
            {/* Fallback Icon si no hay imagen */}
            {!Icon && <MachineryIcon size={40} className="text-stone-300 opacity-20" />}
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Floating Icon */}
      {Icon && (
        <div className="absolute top-3 right-3 z-10 bg-white/90 rounded-lg p-1.5 shadow-sm">
          <Icon size={20} className="text-[var(--color-primary-500)]" />
        </div>
      )}

      {/* Label */}
      <div className="relative z-10 p-3">
        <span className="text-xs font-semibold text-white drop-shadow-sm">{label}</span>
      </div>
    </Link>
  );
}

export async function FeaturedCategories() {
  const destacadas = await obtenerCategoriasDestacadas();

  if (!destacadas || destacadas.length === 0) {
    return null; // O mostrar algo por defecto si prefieres
  }

  return (
    <section className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--color-neutral-900)]">Categorías destacadas</h3>
        <Link
          href="/mercado/categorias"
          className="text-xs font-medium text-[var(--color-primary-500)] hover:underline transition select-none"
        >
          Ver todas las categorias →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {destacadas.map((cat) => (
          <CategoryCard 
            key={cat.categoria_id} 
            label={cat.nombre} 
            slug={cat.categoria_id}
            imageSrc={cat.imagen || undefined}
            Icon={ICON_MAP[cat.nombre]}
          />
        ))}
      </div>
    </section>
  );
}
