/** @jsxImportSource nativewind */
"use client";

import { useState, useCallback, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import type { CategoriaResponse } from "@akindo/shared/api/categorias";
import useRouter, { useActualizarParametros, useSearchParams } from "@akindo/ui/router";
import { H1, P, Pressable, Span } from "@akindo/ui/html";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Pulso } from "@akindo/ui/components/ui/Animaciones";
import { Buscador } from "@akindo/ui/components/ui/Buscador";
import { ChipFiltro } from "@akindo/ui/components/mercado/ChipFiltro";
import { TarjetaCategoria } from "@akindo/ui/components/mercado/TarjetaCategoria";

interface Categoria {
    id: string;
    nombre: string;
    imagen: string | null;
    tipo: "producto" | "distribuidor";
}

type TipoFiltro = "todas" | "producto" | "distribuidor";

const TIPO_TABS: { label: string; valor: TipoFiltro }[] = [
    { label: "Todas", valor: "todas" },
    { label: "Productos", valor: "producto" },
    { label: "Distribuidores", valor: "distribuidor" },
];

function SkeletonCategoria() {
    return <Pulso className="rounded-2xl aspect-square bg-stone-200" />;
}

type CategoriasProps = {
    /** Las dos listas con imagen. Web: server action. Mobile: llamada con el token guardado. */
    cargarCategorias: () => Promise<{ productos: CategoriaResponse[]; distribuidores: CategoriaResponse[] }>;
};

export default function Categorias({ cargarCategorias }: CategoriasProps) {
    const searchParams = useSearchParams();
    const qParam = searchParams.get("q") ?? "";
    const router = useRouter();
    const actualizarParametros = useActualizarParametros();
    const [volverEnHover, setVolverEnHover] = useState(false);

    const [todas, setTodas] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);

    // valorInput: lo que se ve en el input (actualiza con cada tecla)
    const [valorInput, setValorInput] = useState(qParam);
    // busqueda: lo que realmente se busca (solo cambia tras debounce)
    const [busqueda, setBusqueda] = useState(qParam);
    const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>(
        (searchParams.get("tipo") as TipoFiltro) ?? "todas"
    );

    // Sincronizar con URL cuando cambia externamente
    useEffect(() => { setValorInput(qParam); setBusqueda(qParam); }, [qParam]);

    const handleBusqueda = useCallback((q: string) => {
        setBusqueda(q);
        actualizarParametros({ q: q || null });
    }, [actualizarParametros]);

    const handleTipo = useCallback((t: TipoFiltro) => {
        setTipoFiltro(t);
        actualizarParametros({ tipo: t && t !== "todas" ? t : null });
    }, [actualizarParametros]);

    useEffect(() => {
        async function cargar() {
            setCargando(true);
            const { productos, distribuidores } = await cargarCategorias();
            const catProds: Categoria[] = productos.map((c) => ({ ...c, tipo: "producto" as const }));
            const catDists: Categoria[] = distribuidores.map((c) => ({ ...c, tipo: "distribuidor" as const }));
            setTodas([...catProds, ...catDists]);
            setCargando(false);
        }
        cargar();
    }, [cargarCategorias]);

    // Filtrado local
    const categoriasFiltradas = todas.filter((c) => {
        const matchBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const matchTipo = tipoFiltro === "todas" || c.tipo === tipoFiltro;
        return matchBusqueda && matchTipo;
    });

    return (
        <ContenedorPantalla indiceFijo={0} className="flex flex-col min-h-screen bg-white">
            {/* Barra sticky. El original usaba `top-[49px]`, que con el scroll en
                el <main> dejaba 49px de hueco bajo el Header; en nativo el
                stickyHeaderIndices no admite desplazamiento. */}
            <View className="web:sticky top-0 z-20 bg-white border-b border-stone-100 shadow-sm px-4 pt-3 pb-3 flex flex-col gap-2.5">
                <View className="flex flex-row items-center gap-3">
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
                    <Buscador
                        placeholder="Buscar categorías..."
                        valor={valorInput}
                        onBuscar={handleBusqueda}
                        debounceMs={200}
                        className="flex-1"
                        onChange={setValorInput}
                    />
                </View>
                {/* Chips de tipo */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-0.5">
                    {TIPO_TABS.map(({ label, valor }) => (
                        <ChipFiltro key={valor} activo={tipoFiltro === valor} onPress={() => handleTipo(valor)} etiqueta={label} />
                    ))}
                </ScrollView>
            </View>

            {/* Contenido */}
            <View className="px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
                <H1 peso="bold" className="text-base text-[#2B2722] mb-4">
                    Categorías{" "}
                    {!cargando && (
                        <Span className="text-stone-400 text-sm">
                            ({categoriasFiltradas.length})
                        </Span>
                    )}
                </H1>

                {/* `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3` (ver FeaturedCategories). */}
                {cargando ? (
                    <View className="flex flex-row flex-wrap -m-1.5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <View key={i} className="w-1/2 md:w-1/3 lg:w-1/4 p-1.5"><SkeletonCategoria /></View>
                        ))}
                    </View>
                ) : categoriasFiltradas.length === 0 ? (
                    <View className="flex flex-col items-center justify-center py-20">
                        <P className="text-stone-400 text-sm text-center">
                            No se encontraron categorías
                            {busqueda ? ` para "${busqueda}"` : ""}
                        </P>
                    </View>
                ) : (
                    <View className="flex flex-row flex-wrap -m-1.5">
                        {categoriasFiltradas.map((cat) => (
                            <View key={`${cat.tipo}-${cat.id}`} className="w-1/2 md:w-1/3 lg:w-1/4 p-1.5">
                                <TarjetaCategoria
                                    id={cat.id}
                                    nombre={cat.nombre}
                                    imagen={cat.imagen}
                                    tipo={cat.tipo}
                                />
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ContenedorPantalla>
    );
}
