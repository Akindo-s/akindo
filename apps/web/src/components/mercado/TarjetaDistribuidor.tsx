import Link from "next/link";
import { Store, Star } from "lucide-react";

interface TarjetaDistribuidorProps {
    distribuidorId: string;
    nombreNegocio: string;
    imagenFondo: string | null;
    valoracionPromedio: number | null;
    totalValoraciones: number | null;
    categorias: string[] | null;
}

function Estrellitas({ valor }: { valor: number }) {
    const llenas = Math.floor(valor);
    const media = valor - llenas >= 0.5;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    size={11}
                    className={
                        i < llenas
                            ? "text-[var(--color-primary-500)] fill-[var(--color-primary-500)]"
                            : i === llenas && media
                            ? "text-[var(--color-primary-400)] fill-[var(--color-primary-200)]"
                            : "text-stone-300 fill-stone-200"
                    }
                />
            ))}
        </div>
    );
}

/**
 * Tarjeta de distribuidor para el catálogo de mercado.
 * Navega a la tienda pública del distribuidor al hacer clic.
 */
export function TarjetaDistribuidor({
    distribuidorId,
    nombreNegocio,
    imagenFondo,
    valoracionPromedio,
    totalValoraciones,
    categorias,
}: TarjetaDistribuidorProps) {
    return (
        <Link
            href={`/mercado/distribuidor/tienda?d=${distribuidorId}`}
            className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
            {/* Imagen de fondo / Hero */}
            <div className="relative w-full h-36 bg-gradient-to-br from-[var(--color-secondary-200)] to-[var(--color-secondary-400)] overflow-hidden">
                {imagenFondo ? (
                    <img
                        src={imagenFondo}
                        alt={nombreNegocio}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Store size={40} className="text-[var(--color-neutral-400)]" />
                    </div>
                )}
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Contenido */}
            <div className="p-3 flex flex-col gap-1.5">
                <h3 className="text-sm font-bold text-stone-900 line-clamp-1 leading-snug">
                    {nombreNegocio}
                </h3>

                {/* Rating */}
                {valoracionPromedio !== null && (
                    <div className="flex items-center gap-1.5">
                        <Estrellitas valor={valoracionPromedio} />
                        <span className="text-[11px] text-stone-500">
                            {valoracionPromedio.toFixed(1)}
                            {totalValoraciones ? ` (${totalValoraciones})` : ""}
                        </span>
                    </div>
                )}

                {/* Categorías */}
                {categorias && categorias.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {categorias.slice(0, 3).map((cat) => (
                            <span
                                key={cat}
                                className="text-[10px] font-medium bg-[var(--color-primary-50)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-full border border-[var(--color-primary-200)]"
                            >
                                {cat}
                            </span>
                        ))}
                        {categorias.length > 3 && (
                            <span className="text-[10px] text-stone-400 px-1 self-center">
                                +{categorias.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
