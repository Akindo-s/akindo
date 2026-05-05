"use client";

import { Buscador } from "@/components/ui/Buscador";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { StorefrontIcon } from "../icons/NavigationIcons";
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
    onChange?: (valor: string) => void;
    desactivarAutoBusqueda?: boolean;
}

export function BarraBusquedaFiltros({
    placeholder = "Buscar...",
    categorias: categoriasProp,        
    categoriaSeleccionada = null,     
    onCategoriaChange,
    className = "",
    mostrarVolver = false,
    valorBusqueda = "",                
    onChange,
    onBuscar,
    desactivarAutoBusqueda = false,
}: BarraBusquedaFiltrosProps) {
    const router = useRouter();
    const categoriasContexto = useCategorias();

    
    const categorias = categoriasProp ?? categoriasContexto;

    const handleCategoria = (id: string | null, tipo?: "producto" | "distribuidor") => {
        if (onCategoriaChange) {
            // Modo controlado: delega al padre
            onCategoriaChange(id, tipo);
        } else {
            // Modo autónomo: navega directamente
            if (!id || !tipo) return;
            if (tipo === "producto") router.push(`/mercado/${tipo??"producto"}?categoria=${id}`);
            else router.push(`/mercado/${tipo??"producto"}?categoria=${id}`);
        }
    };

    return (
        <div className={`w-full sticky top-0 z-20 bg-white border-b border-stone-100 shadow-sm px-4 pt-3 pb-3 flex flex-col gap-2.5 ${className}`}>
            <div className="flex items-center gap-3">
                {mostrarVolver && (
                    <button
                        onClick={() => router.back()}
                        className="p-1.5 -ml-1.5 text-stone-600 hover:text-stone-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <Buscador
                    placeholder={placeholder}
                    valor={valorBusqueda}         
                    onBuscar={onBuscar}
                    debounceMs={350}
                    onChange={onChange}
                    className="flex-1"
                    desactivarAutoBusqueda={desactivarAutoBusqueda}
                />
            </div>

            {categorias && categorias.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-0.5 w-full scroll-auto">
                    <button
                        type="button"
                        onClick={() => handleCategoria(null, undefined)}
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
                            onClick={() => handleCategoria(
                                categoriaSeleccionada === cat.id ? null : cat.id,
                                cat.tipo
                            )}
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