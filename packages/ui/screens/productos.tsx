/** @jsxImportSource nativewind */
"use client";

import { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { listarProductosCatalogo, type ProductoCatalogoResponse } from "@akindo/shared/api/productos";
import { useCategorias } from "@akindo/shared/categorias-context";
import { useActualizarParametros, useSearchParams } from "@akindo/ui/router";
import { H1, P, Span } from "@akindo/ui/html";
import { ContenedorPantalla, Centinela } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Pulso, Spinner } from "@akindo/ui/components/ui/Animaciones";
import { TarjetaProductoCatalogo } from "@akindo/ui/components/mercado/TarjetaProductoCatalogo";
import { BarraBusquedaFiltros } from "@akindo/ui/components/mercado/BarraBusquedaFiltros";
import { useScrollInfinito } from "../components/hooks/useScrollInfinito";

function SkeletonProducto() {
    return (
        <Pulso className="bg-white rounded-2xl border border-stone-100 drop-shadow-sm overflow-hidden">
            <View className="w-full h-36 bg-stone-200" />
            <View className="p-3 flex flex-col gap-2">
                <View className="h-4 w-3/4 bg-stone-200 rounded" />
                <View className="h-5 w-1/2 bg-stone-200 rounded" />
            </View>
        </Pulso>
    );
}

/**
 * Catálogo de productos con búsqueda, filtro por categoría y scroll infinito.
 * Las categorías de los chips vienen del `CategoriasProvider` (web: layout de
 * mercado/productos; mobile: la ruta).
 */
export default function Productos() {
    const searchParams = useSearchParams();
    const qParam = searchParams.get("q") ?? "";
    const categoriaParam = searchParams.get("categoria");

    const categorias = useCategorias();
    const actualizarParametros = useActualizarParametros();

    // valorInput: lo que se ve en el input (actualiza con cada tecla)
    const [valorInput, setValorInput] = useState(qParam);
    // busqueda: lo que realmente se busca (solo cambia tras debounce)
    const [busqueda, setBusqueda] = useState(qParam);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(
        categoriaParam ?? null
    );

    // Sincronizar con URL cuando cambia externamente
    useEffect(() => { setValorInput(qParam); setBusqueda(qParam); }, [qParam]);
    useEffect(() => { setCategoriaSeleccionada(categoriaParam ?? null); }, [categoriaParam]);
    const resetKey = `${busqueda}|${categoriaSeleccionada ?? ""}`;

    // Lectura pública: va directo al núcleo compartido en las dos plataformas.
    const fetchFn = useCallback(async (pagina: number) => {
        const data = await listarProductosCatalogo(
            pagina, 12, busqueda,
            categoriaSeleccionada ? [categoriaSeleccionada] : undefined,
        );
        return { items: data.productos, tieneSiguiente: data.tiene_siguiente };
    }, [busqueda, categoriaSeleccionada]);

    const { items, cargando, cargandoMas, cargarSiguiente, tieneSiguiente } = useScrollInfinito<ProductoCatalogoResponse>({
        fetchFn,
        resetKey,
    });

    const handleBusqueda = useCallback((q: string) => {
        // Se llama tras el debounce — actualiza búsqueda Y URL
        setBusqueda(q);
        actualizarParametros({ q: q || null });
    }, [actualizarParametros]);

    const handleCategoria = useCallback((c: string | null) => {
        setCategoriaSeleccionada(c);
        actualizarParametros({ categoria: c });
    }, [actualizarParametros]);

    return (
        <ContenedorPantalla indiceFijo={0} className="flex flex-col min-h-screen bg-white">
            {/* Barra sticky */}
            <BarraBusquedaFiltros
                placeholder="Buscar productos..."
                valorBusqueda={valorInput}
                categorias={categorias ?? []}
                categoriaSeleccionada={categoriaSeleccionada}
                onBuscar={handleBusqueda}
                onCategoriaChange={handleCategoria}
                mostrarVolver={true}
                onChange={setValorInput}
            />

            {/* Lista */}
            <View className="px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
                {/* En fila y no como Span anidado en el H1: un Text anidado no
                    tiene margen en nativo y el ml-1.5 se perdía. */}
                <View className="flex flex-row items-baseline mb-4">
                    <H1 peso="bold" className="text-base text-[#2B2722]">Productos</H1>
                    {!cargando && (
                        <Span className="text-stone-400 text-sm ml-1.5">
                            ({items.length}{cargandoMas ? "+" : ""})
                        </Span>
                    )}
                </View>

                {/* `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3` (ver FeaturedCategories). */}
                <View className="flex flex-row flex-wrap -m-1.5">
                    {cargando
                        ? Array.from({ length: 8 }).map((_, i) => (
                              <View key={i} className="w-1/2 md:w-1/3 lg:w-1/4 p-1.5"><SkeletonProducto /></View>
                          ))
                        : items.map((p, index) => (
                              <View key={`${p.producto_id}${index}`} className="w-1/2 md:w-1/3 lg:w-1/4 p-1.5">
                                  <TarjetaProductoCatalogo
                                      productoId={p.producto_id}
                                      nombre={p.nombre}
                                      costo={p.costo}
                                      unidad={p.unidad}
                                      imagen={p.imagen}
                                      disponible={p.disponible}
                                  />
                              </View>
                          ))}
                </View>

                {/* Estado vacío */}
                {!cargando && items.length === 0 && (
                    <View className="flex flex-col items-center justify-center py-20">
                        <P className="text-stone-400 text-sm text-center">
                            No se encontraron productos
                            {busqueda ? ` para "${busqueda}"` : ""}
                        </P>
                    </View>
                )}

                {tieneSiguiente && (
                    <Centinela onVisible={cargarSiguiente} className="flex flex-row justify-center py-6">
                        {cargandoMas && <Spinner />}
                    </Centinela>
                )}
            </View>
        </ContenedorPantalla>
    );
}
