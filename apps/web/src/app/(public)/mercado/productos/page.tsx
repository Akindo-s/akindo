"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { listarProductosCatalogo, type ProductoCatalogoResponse } from "@/lib/api/productos";
import { obtenerCategoriasDisponibles, type CategoriaProductos } from "@/lib/api/productos";
import { TarjetaProductoCatalogo } from "@/components/mercado/TarjetaProductoCatalogo";
import { BarraBusquedaFiltros } from "@/components/mercado/BarraBusquedaFiltros";
import { useScrollInfinito } from "@/components/hooks/useScrollInfinito";

function SkeletonProducto() {
    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden animate-pulse">
            <div className="w-full h-36 bg-stone-200" />
            <div className="p-3 flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-stone-200 rounded" />
                <div className="h-5 w-1/2 bg-stone-200 rounded" />
            </div>
        </div>
    );
}

function ProductosContent() {
    const searchParams = useSearchParams();
    const qParam = searchParams.get("q") ?? "";
    const categoriaParam = searchParams.get("categoria");

    const [categorias, setCategorias] = useState<CategoriaProductos[]>([]);
    const [busqueda, setBusqueda] = useState(qParam);
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

    // Cargar categorías de productos para los filtros
    useEffect(() => {
        obtenerCategoriasDisponibles().then(setCategorias);
    }, []);

    const resetKey = `${busqueda}|${categoriaSeleccionada ?? ""}`;

    const fetchFn = useCallback(
        async (pagina: number) => {
            const data = await listarProductosCatalogo(
                pagina,
                12,
                busqueda,
                categoriaSeleccionada ? [categoriaSeleccionada] : undefined,
            );
            return {
                items: data.productos,
                tieneSiguiente: data.tiene_siguiente,
            };
        },
        [busqueda, categoriaSeleccionada]
    );

    const { items, cargando, cargandoMas, centinelaRef } = useScrollInfinito<ProductoCatalogoResponse>({
        fetchFn,
        resetKey,
    });

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Barra sticky */}
            <BarraBusquedaFiltros
                placeholder="Buscar productos..."
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
                    Productos
                    {!cargando && (
                        <span className="text-stone-400 font-normal text-sm ml-1.5">
                            ({items.length}{cargandoMas ? "+" : ""})
                        </span>
                    )}
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cargando
                        ? Array.from({ length: 8 }).map((_, i) => <SkeletonProducto key={i} />)
                        : items.map((p) => (
                              <TarjetaProductoCatalogo
                                  key={`${p.producto_id}${Math.random()}`}
                                  productoId={p.producto_id}
                                  nombre={p.nombre}
                                  costo={p.costo}
                                  unidad={p.unidad}
                                  imagen={p.imagen}
                                  disponible={p.disponible}
                              />
                          ))}
                </div>

                {/* Estado vacío */}
                {!cargando && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-stone-400 text-sm">
                            No se encontraron productos
                            {busqueda ? ` para "${busqueda}"` : ""}
                        </p>
                    </div>
                )}

                {/* Centinela */}
                <div ref={centinelaRef} className="flex justify-center py-6">
                    {cargandoMas && (
                        <div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProductosPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" /></div>}>
            <ProductosContent />
        </Suspense>
    );
}
