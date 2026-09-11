/** @jsxImportSource nativewind */
"use client";

import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { ArrowLeft, Package } from "lucide-react-native";
import useRouter from "@akindo/ui/router";
import { useCategorias } from "@akindo/shared/categorias-context";
import { Buscador } from "../ui/Buscador";
import { Pressable } from "../html-elements";
import { StorefrontIcon } from "../../icons/NavigationIcons";
import { ChipFiltro } from "./ChipFiltro";

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
    const [volverEnHover, setVolverEnHover] = useState(false);

    const categorias = categoriasProp ?? categoriasContexto;

    const handleCategoria = (id: string | null, tipo?: "producto" | "distribuidor") => {
        if (onCategoriaChange) {
            // Modo controlado: delega al padre
            onCategoriaChange(id, tipo);
        } else {
            // Modo autónomo: navega directamente
            if (!id || !tipo) return;
            if (tipo === "producto") router.push(`/mercado/productos?categoria=${id}`);
            else if (tipo === "distribuidor") router.push(`/mercado/distribuidores?categoria=${id}`);
            else router.push(`/mercado/${tipo ?? "productos"}?categoria=${id}`);
        }
    };

    const handleBuscar = useCallback((q: string) => {
        // Antes también navegaba cuando la página ya manejaba la búsqueda: en
        // distribuidores el `push` chocaba con el `replace` de la página y se
        // quedaba cargando; en nativo apilaba una pantalla por búsqueda.
        if (onBuscar) onBuscar(q);
        else router.push(`/mercado/productos?q=${q}`)
    }, [onBuscar])

    return (
        // `sticky` no existe en nativo: ahí lo resuelve el ScrollView de la
        // pantalla con stickyHeaderIndices (ver ContenedorPantalla).
        <View className={`w-full web:sticky top-0 z-20 bg-white border-b border-stone-100 shadow-sm flex flex-col gap-1 ${className}`}>

            <View className="flex flex-row items-center gap-3 px-4 pt-3 pb-3">
                {mostrarVolver && (
                    <Pressable
                        role="button"
                        accessibilityLabel="Volver"
                        onPress={() => router.back()}
                        onHoverIn={() => setVolverEnHover(true)}
                        onHoverOut={() => setVolverEnHover(false)}
                        className="p-1.5 -ml-1.5 transition-colors"
                    >
                        {/* text-stone-600, y text-stone-900 en hover. */}
                        <ArrowLeft size={20} color={volverEnHover ? "#1C1917" : "#57534E"} />
                    </Pressable>
                )}
                <Buscador
                    placeholder={placeholder}
                    valor={valorBusqueda}
                    onBuscar={handleBuscar}
                    debounceMs={350}
                    onChange={onChange}
                    className="flex-1"
                    desactivarAutoBusqueda={desactivarAutoBusqueda}
                />
            </View>

            {categorias && categorias.length > 0 && (
                <ScrollView
                    horizontal
                    className="w-full mb-3"
                    contentContainerClassName="gap-2 pb-0.5 pl-4"
                >
                    <ChipFiltro activo={!categoriaSeleccionada} onPress={() => handleCategoria(null, undefined)} etiqueta="Todas" />

                    {categorias.map((cat) => (
                        <ChipFiltro
                            key={cat.id}
                            activo={categoriaSeleccionada === cat.id}
                            onPress={() => handleCategoria(
                                categoriaSeleccionada === cat.id ? null : cat.id,
                                cat.tipo
                            )}
                            etiqueta={cat.nombre}
                            Icono={cat.tipo === "producto" ? Package : cat.tipo === "distribuidor" ? StorefrontIcon : undefined}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
