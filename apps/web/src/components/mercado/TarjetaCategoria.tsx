import Link from "next/link";
import { Package } from "lucide-react";

interface TarjetaCategoriaProps {
    id: string;
    nombre: string;
    imagen: string | null;
    tipo: "producto" | "distribuidor";
}

/**
 * Tarjeta visual de categoría para el mercado.
 * Al hacer clic navega a la página de productos o distribuidores con el filtro aplicado.
 */
export function TarjetaCategoria({ id, nombre, imagen, tipo }: TarjetaCategoriaProps) {
    const href =
        tipo === "producto"
            ? `/mercado/productos?categoria=${id}`
            : `/mercado/distribuidores?categoria=${id}`;

    const badgeLabel = tipo === "producto" ? "Productos" : "Distribuidores";
    const badgeColor =
        tipo === "producto"
            ? "bg-[var(--color-primary-500)] text-white"
            : "bg-[var(--color-neutral-700)] text-white";

    return (
        <Link
            href={href}
            className="relative rounded-2xl overflow-hidden aspect-square flex flex-col justify-end bg-[var(--color-neutral-200)] hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
        >
            {/* Imagen de fondo */}
            {imagen ? (
                <img
                    src={imagen}
                    alt={nombre}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-secondary-200)] to-[var(--color-secondary-400)]">
                    <Package size={36} className="text-[var(--color-neutral-400)]" />
                </div>
            )}

            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Badge de tipo */}
            <div className="absolute top-2.5 left-2.5 z-10">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {badgeLabel}
                </span>
            </div>

            {/* Nombre */}
            <div className="relative z-10 p-3">
                <span className="text-xs font-bold text-white drop-shadow-sm line-clamp-2 leading-snug">
                    {nombre}
                </span>
            </div>
        </Link>
    );
}
