import Link from "next/link";
import { MachineryIcon, PackagingIcon, ArtsAndCraftsIcon } from "../icons/CategoriesIcons";

interface CategoryCardProps {
  label: string;
  slug: string;
  imageSrc?: string;
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORIES: CategoryCardProps[] = [
  { label: "Equipo Industrial", slug: "equipo-industrial", Icon: MachineryIcon },
  { label: "Materiales de Embalaje", slug: "materiales-embalaje", Icon: PackagingIcon },
  { label: "Artesanías", slug: "artesanias", Icon: ArtsAndCraftsIcon },
  { label: "Materias primas", slug: "materias-primas" },
];

function CategoryCard({ label, slug, imageSrc, Icon }: CategoryCardProps) {
  return (
    <Link
      href={`/mercado/categorias`}
      className="relative rounded-xl overflow-hidden aspect-square flex flex-col justify-end bg-[var(--color-neutral-200)] hover:scale-[1.02] transition-transform"
    >
      {/* Imagen de fondo */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Ícono */}
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

export function FeaturedCategories() {
  return (
    <section className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--color-neutral-900)]">Categorías destacadas</h3>
        <Link
          href="/mercado"
          className="text-xs font-medium text-[var(--color-primary-500)] hover:underline transition select-none"
        >
          Ver todo →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.slug} {...cat} />
        ))}
      </div>
    </section>
  );
}
