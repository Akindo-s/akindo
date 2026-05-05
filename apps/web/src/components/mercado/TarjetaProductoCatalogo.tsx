import { Package } from "lucide-react";
import Link from "next/link";

interface TarjetaProductoCatalogoProps {
    productoId: string;
    nombre: string;
    costo: number;
    unidad: string;
    imagen: string | null;
    disponible: boolean;
}

/**
 * Tarjeta de producto simplificada para el catálogo público del mercado.
 * Solo lectura — sin controles de edición ni archivar.
 */
export function TarjetaProductoCatalogo({
    productoId,
    nombre,
    costo,
    unidad,
    imagen,
    disponible,
}: TarjetaProductoCatalogoProps) {
    return (
        <Link
            href={`/mercado/productos/detalle?p=${productoId}`}
            className={`block bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                !disponible ? "opacity-60" : ""
            }`}
        >
            {/* Imagen */}
            <div className="relative w-full h-36 bg-[var(--color-secondary-200)]">
                {imagen ? (
                    <img
                        src={imagen}
                        alt={nombre}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={36} className="text-stone-300" />
                    </div>
                )}
                {!disponible && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-[10px] font-semibold text-white bg-black/50 px-2 py-0.5 rounded-full">
                            No disponible
                        </span>
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="p-3 flex flex-col gap-1">
                <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                    {nombre}
                </h3>
                <p className="text-base font-bold text-[var(--color-primary-500)] mt-auto">
                    ${costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-stone-400 ml-0.5">/{unidad}</span>
                </p>
            </div>
        </Link>
    );
}
