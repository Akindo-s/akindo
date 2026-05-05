"use client";

import { useState, useCallback, useEffect } from "react";
import { obtenerCategoriasProductos, obtenerCategoriasDistribuidores } from "@/lib/api/categorias";
import { TarjetaCategoria } from "@/components/mercado/TarjetaCategoria";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Buscador } from "@/components/ui/Buscador";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

interface Categoria {
    id: string;
    nombre: string;
    imagen: string | null;
    tipo: "producto" | "distribuidor";
}

type TipoFiltro = "todas" | "producto" | "distribuidor";

function SkeletonCategoria() {
    return (
        <div className="rounded-2xl aspect-square bg-stone-200 animate-pulse" />
    );
}

function CategoriasPage() {
    const searchParams = useSearchParams();
    const qParam = searchParams.get("q") ?? "";
    const router = useRouter();
    const pathname = usePathname();

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
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set("q", q);
        else params.delete("q");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchParams, pathname, router]);

    const handleTipo = useCallback((t: TipoFiltro) => {
        setTipoFiltro(t);
        const params = new URLSearchParams(searchParams.toString());
        if (t && t !== "todas") params.set("tipo", t);
        else params.delete("tipo");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchParams, pathname, router]);

    useEffect(() => {
        async function cargar() {
            setCargando(true);
            const [prods, dists] = await Promise.all([
                obtenerCategoriasProductos(),
                obtenerCategoriasDistribuidores(),
            ]);
            const catProds: Categoria[] = prods.map((c) => ({ ...c, tipo: "producto" as const }));
            const catDists: Categoria[] = dists.map((c) => ({ ...c, tipo: "distribuidor" as const }));
            setTodas([...catProds, ...catDists]);
            setCargando(false);
        }
        cargar();
    }, []);

    // Filtrado local
    const categoriasFiltradas = todas.filter((c) => {
        const matchBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const matchTipo = tipoFiltro === "todas" || c.tipo === tipoFiltro;
        return matchBusqueda && matchTipo;
    });

    const TIPO_TABS: { label: string; valor: TipoFiltro }[] = [
        { label: "Todas", valor: "todas" },
        { label: "Productos", valor: "producto" },
        { label: "Distribuidores", valor: "distribuidor" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Barra sticky */}
            <div className="sticky top-[49px] z-20 bg-white border-b border-stone-100 shadow-sm px-4 pt-3 pb-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="p-1.5 -ml-1.5 text-stone-600 hover:text-stone-900 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    </button>
                    <Buscador
                        placeholder="Buscar categorías..."
                        valor={valorInput}
                        onBuscar={handleBusqueda}
                        debounceMs={200}
                        className="flex-1"
                        onChange={setValorInput}
                    />
                </div>
                {/* Chips de tipo */}
                <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                    {TIPO_TABS.map(({ label, valor }) => (
                        <button
                            key={valor}
                            type="button"
                            onClick={() => handleTipo(valor)}
                            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                tipoFiltro === valor
                                    ? "bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]"
                                    : "bg-transparent text-stone-600 border-stone-200 hover:bg-stone-50"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido */}
            <div className="px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
                <h1 className="text-base font-bold text-[var(--color-neutral-900)] mb-4">
                    Categorías{" "}
                    {!cargando && (
                        <span className="text-stone-400 font-normal text-sm">
                            ({categoriasFiltradas.length})
                        </span>
                    )}
                </h1>

                {cargando ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonCategoria key={i} />
                        ))}
                    </div>
                ) : categoriasFiltradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-stone-400 text-sm">
                            No se encontraron categorías
                            {busqueda ? ` para "${busqueda}"` : ""}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categoriasFiltradas.map((cat) => (
                            <TarjetaCategoria
                                key={`${cat.tipo}-${cat.id}`}
                                id={cat.id}
                                nombre={cat.nombre}
                                imagen={cat.imagen}
                                tipo={cat.tipo}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CategoriasPageWrapper() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" /></div>}>
            <CategoriasPage />
        </Suspense>
    );
}
