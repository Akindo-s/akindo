"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { listarDistribuidores, type MiniDistribuidorResponse } from "@/lib/api/distribuidor";
import { obtenerCategoriasDistribuidores } from "@/lib/api/categorias";
import { TarjetaDistribuidor } from "@/components/mercado/TarjetaDistribuidor";
import { BarraBusquedaFiltros } from "@/components/mercado/BarraBusquedaFiltros";
import { useScrollInfinito } from "@/components/hooks/useScrollInfinito";

function SkeletonDistribuidor() {
    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden animate-pulse">
            <div className="w-full h-36 bg-stone-200" />
            <div className="p-3 flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-stone-200 rounded" />
                <div className="h-3 w-1/3 bg-stone-200 rounded" />
                <div className="flex gap-1">
                    <div className="h-4 w-14 bg-stone-200 rounded-full" />
                    <div className="h-4 w-14 bg-stone-200 rounded-full" />
                </div>
            </div>
        </div>
    );
}

function DistribuidoresContent() {
    const searchParams = useSearchParams();
    const categoriaParam = searchParams.get("categoria");

    const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
    const [busqueda, setBusqueda] = useState(searchParams.get("q") ?? "");
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(
        categoriaParam ?? null
    );

    const router = useRouter();
    const pathname = usePathname();

    const handleBusqueda = (q: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set("q", q);
        else params.delete("q");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleCategoria = (c: string | null) => {
        setCategoriaSeleccionada(c);
        const params = new URLSearchParams(searchParams.toString());
        if (c) params.set("categoria", c);
        else params.delete("categoria");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Cargar categorías de distribuidores para los filtros
    useEffect(() => {
        obtenerCategoriasDistribuidores().then(setCategorias);
    }, []);

    // La resetKey combina búsqueda + categoría para recargar la lista cuando cambian
    const resetKey = `${busqueda}|${categoriaSeleccionada ?? ""}`;

    const fetchFn = useCallback(
        async (pagina: number) => {
            const data = await listarDistribuidores(
                pagina,
                12,
                categoriaSeleccionada ? [categoriaSeleccionada] : undefined,
            );
            return {
                items: data.distribuidores,
                tieneSiguiente: data.tiene_siguiente,
            };
        },
        [categoriaSeleccionada]
    );

    const { items, cargando, cargandoMas, centinelaRef } = useScrollInfinito<MiniDistribuidorResponse>({
        fetchFn,
        resetKey,
    });

    // Filtrado local por búsqueda (el backend no filtra por nombre en este endpoint)


    const [distriburidoresMostrados,setDistribuidoresMostrados] = useState(busqueda
        ? items.filter((d) =>
              d.nombre_negocio.toLowerCase().includes(busqueda.toLowerCase())
          )
        : items)

    useEffect(()=>{
        setDistribuidoresMostrados(busqueda
        ? items.filter((d) =>
              d.nombre_negocio.toLowerCase().includes(busqueda.toLowerCase())
          )
        : items)
    },[busqueda, items])


    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Barra sticky */}
            <BarraBusquedaFiltros
                placeholder="Buscar distribuidores..."
                valorBusqueda={busqueda}
                categorias={categorias}
                categoriaSeleccionada={categoriaSeleccionada}
                onBuscar={handleBusqueda}
                onCategoriaChange={handleCategoria}
                mostrarVolver={true}
                onChange={setBusqueda}
            />

            {/* Lista */}
            <div className="px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
                <h1 className="text-base font-bold text-[var(--color-neutral-900)] mb-4">
                    Distribuidores
                    {!cargando && (
                        <span className="text-stone-400 font-normal text-sm ml-1.5">
                            ({distriburidoresMostrados.length}
                            {cargandoMas ? "+" : ""})
                        </span>
                    )}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cargando
                        ? Array.from({ length: 6 }).map((_, i) => <SkeletonDistribuidor key={i} />)
                        : distriburidoresMostrados.map((d,index) => (
                              <TarjetaDistribuidor
                                  key={`${d.distribuidor_id}-${index}`}
                                  distribuidorId={d.distribuidor_id}
                                  nombreNegocio={d.nombre_negocio}
                                  imagenFondo={d.imagen_fondo}
                                  valoracionPromedio={d.valoracion_promedio}
                                  totalValoraciones={d.total_valoraciones}
                                  categorias={d.categorias}
                              />
                          ))}
                </div>

                {/* Estado vacío */}
                {!cargando && distriburidoresMostrados.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-stone-400 text-sm">
                            No se encontraron distribuidores
                            {busqueda ? ` para "${busqueda}"` : ""}
                        </p>
                    </div>
                )}

                {/* Centinela de scroll infinito */}
                <div ref={centinelaRef} className="flex justify-center py-6">
                    {cargandoMas && (
                        <div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DistribuidoresPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" /></div>}>
            <DistribuidoresContent />
        </Suspense>
    );
}
