"use client";

import { Buscador } from "@/components/ui/Buscador";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { StorefrontIcon } from "../icons/NavigationIcons";
import { useState } from "react";
import { useCategorias } from "@/lib/categorias-context";

interface Categoria {
    id: string;
    nombre: string;
    tipo?: "producto" | "distribuidor";
}

interface BarraBusquedaFiltrosProps {
    placeholder?: string;
    categorias?: Categoria[];
    categoriaSeleccionada?: string | null;
    onBuscar?: (q: string) => void;
    onCategoriaChange?: (id: string | null, tipo?: "producto" | "distribuidor") => void;
    className?: string;
    mostrarVolver?: boolean;
    valorBusqueda?: string;
    onChange?:(valor:string)=>void;
    desactivarAutoBusqueda?: boolean;
}

/**
 * Barra sticky de búsqueda + filtros de categoría para las páginas del mercado.
 *
 * Queda fijada debajo del Header (`sticky top-[49px]`) con fondo blanco.
 * En mobile los chips de categoría tienen scroll horizontal.
 */
export function BarraBusquedaFiltros({
    placeholder = "Buscar...",
    
    
    
    
    className = "",
    mostrarVolver = false,
    
    
    desactivarAutoBusqueda = false
}: BarraBusquedaFiltrosProps) {
    


    const router = useRouter();
    const [q, setQ] = useState("");
    const categorias = useCategorias();
    const [categoriaSeleccionada,setCategoriaSeleccionada] = useState({id:'',tipo:''});

    const handleBuscar = (busqueda: string) => {
        const trimmed = busqueda.trim();
        if (trimmed) {
            router.push(`/mercado/productos?q=${encodeURIComponent(trimmed)}`);
        } else {
            router.push("/mercado/productos");
        }
    };

    const handleCategoria = (id: string | null, tipo?: "producto" | "distribuidor") => {
        if (!id || !tipo) return;
        setCategoriaSeleccionada({id:id,tipo:tipo})
        if (tipo === "producto") {
            router.push(`/mercado/productos?categoria=${id}`);
        } else {
            router.push(`/mercado/distribuidores?categoria=${id}`);
        }
    };

    return (
        <div
            className={`w-full sticky top-0 z-20 bg-white border-b border-stone-100 shadow-sm px-4 pt-3 pb-3 flex flex-col gap-2.5 ${className}`}
        >
            <div className="flex items-center gap-3">
                {mostrarVolver && (
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 -ml-1.5 text-stone-600 hover:text-stone-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                {/* Buscador */}
                <Buscador
                    placeholder={placeholder}
                    valor={q}
                    onBuscar={handleBuscar}
                    debounceMs={350}
                    onChange={setQ}
                    className="flex-1"
                    desactivarAutoBusqueda={desactivarAutoBusqueda}
                />
            </div>

            {/* Chips de categoría */}

            
            {categorias&&categorias.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-0.5 w-full scroll-auto ">
                    {/* Chip "Todas" */}
                    <button
                        type="button"
                        onClick={() => handleCategoria?.(null, undefined)}
                        className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                            !categoriaSeleccionada
                                ? "bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]"
                                : "bg-transparent text-stone-600 border-stone-200 hover:bg-stone-50"
                        }`}
                    >
                        Todas
                    </button>

                    {categorias.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                                handleCategoria?.(
                                    categoriaSeleccionada === cat.id ? null : cat.id,
                                    cat.tipo
                                )
                            }
                            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                categoriaSeleccionada === cat.id
                                    ? "bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]"
                                    : "bg-transparent text-stone-600 border-stone-200 hover:bg-stone-50"
                            }`}
                        >
                            {cat.tipo === "producto" && <Package size={12} />}
                            {cat.tipo === "distribuidor" && <StorefrontIcon size={12} />}
                            {cat.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
