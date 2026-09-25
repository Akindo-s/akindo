/** @jsxImportSource nativewind */
"use client";

import { useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { listarDistribuidores, type MiniDistribuidorResponse } from "@akindo/shared/api/distribuidor";
import { useCategorias } from "@akindo/shared/categorias-context";
import { useActualizarParametros, useSearchParams } from "@akindo/ui/router";
import { H1, P, Span } from "@akindo/ui/html";
import { ContenedorPantalla, Centinela } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Pulso, Spinner } from "@akindo/ui/components/ui/Animaciones";
import { TarjetaDistribuidor } from "@akindo/ui/components/mercado/TarjetaDistribuidor";
import { BarraBusquedaFiltros } from "@akindo/ui/components/mercado/BarraBusquedaFiltros";
import { useScrollInfinito } from "../components/hooks/useScrollInfinito";

function SkeletonDistribuidor() {
    return (
        <Pulso className="bg-white rounded-2xl border border-stone-100 drop-shadow-sm overflow-hidden">
            <View className="w-full h-36 bg-stone-200" />
            <View className="p-3 flex flex-col gap-2">
                <View className="h-4 w-3/4 bg-stone-200 rounded" />
                <View className="h-3 w-1/3 bg-stone-200 rounded" />
                <View className="flex flex-row gap-1">
                    <View className="h-4 w-14 bg-stone-200 rounded-full" />
                    <View className="h-4 w-14 bg-stone-200 rounded-full" />
                </View>
            </View>
        </Pulso>
    );
}

/**
 * Directorio de distribuidores con filtro por categoría y scroll infinito. La
 * búsqueda por nombre filtra en local (el endpoint no filtra por nombre).
 */
export default function Distribuidores() {
    const searchParams = useSearchParams();
    const qParam = searchParams.get("q") ?? "";
    const categoriaParam = searchParams.get("categoria");

    // Igual que en web: esta ruta no tiene CategoriasProvider, así que no hay chips.
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

    const handleBusqueda = useCallback((q: string) => {
        setBusqueda(q);
        actualizarParametros({ q: q || null });
    }, [actualizarParametros]);

    const handleCategoria = useCallback((c: string | null) => {
        setCategoriaSeleccionada(c);
        actualizarParametros({ categoria: c });
    }, [actualizarParametros]);

    // La resetKey combina búsqueda + categoría para recargar la lista cuando cambian
    const resetKey = `${busqueda}|${categoriaSeleccionada ?? ""}`;

    // Lectura pública: va directo al núcleo compartido en las dos plataformas.
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

    const { items, cargando, cargandoMas, cargarSiguiente, tieneSiguiente } = useScrollInfinito<MiniDistribuidorResponse>({
        fetchFn,
        resetKey,
    });

    // Filtrado local por búsqueda (el backend no filtra por nombre en este endpoint)
    const distribuidoresMostrados = busqueda
        ? items.filter((d) => d.nombre_negocio.toLowerCase().includes(busqueda.toLowerCase()))
        : items;

    return (
        <ContenedorPantalla indiceFijo={0} className="flex flex-col min-h-screen bg-white">
            {/* Barra sticky */}
            <BarraBusquedaFiltros
                placeholder="Buscar distribuidores..."
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
                {/* En fila: un Text anidado no tiene margen en nativo (ver productos). */}
                <View className="flex flex-row items-baseline mb-4">
                    <H1 peso="bold" className="text-base text-[#2B2722]">Distribuidores</H1>
                    {!cargando && (
                        <Span className="text-stone-400 text-sm ml-1.5">
                            ({distribuidoresMostrados.length}
                            {cargandoMas ? "+" : ""})
                        </Span>
                    )}
                </View>

                {/* `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`: celdas con p-2 y la fila -m-2. */}
                <View className="flex flex-row flex-wrap -m-2">
                    {cargando
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <View key={i} className="w-full md:w-1/2 lg:w-1/3 p-2"><SkeletonDistribuidor /></View>
                          ))
                        : distribuidoresMostrados.map((d) => (
                              <View key={d.distribuidor_id} className="w-full md:w-1/2 lg:w-1/3 p-2">
                                  <TarjetaDistribuidor
                                      distribuidorId={d.distribuidor_id}
                                      nombreNegocio={d.nombre_negocio}
                                      imagenFondo={d.imagen_fondo}
                                      valoracionPromedio={d.valoracion_promedio}
                                      totalValoraciones={d.total_valoraciones}
                                      categorias={d.categorias}
                                  />
                              </View>
                          ))}
                </View>

                {/* Estado vacío */}
                {!cargando && distribuidoresMostrados.length === 0 && (
                    <View className="flex flex-col items-center justify-center py-20">
                        <P className="text-stone-400 text-sm text-center">
                            No se encontraron distribuidores
                            {busqueda ? ` para "${busqueda}"` : ""}
                        </P>
                    </View>
                )}

                {/* Centinela de scroll infinito */}
                {tieneSiguiente && (
                    <Centinela onVisible={cargarSiguiente} className="flex flex-row justify-center py-6">
                        {cargandoMas && <Spinner />}
                    </Centinela>
                )}
            </View>
        </ContenedorPantalla>
    );
}
