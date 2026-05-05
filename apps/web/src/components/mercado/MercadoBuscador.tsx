"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BarraBusquedaFiltros } from "./BarraBusquedaFiltros";
import { obtenerCategoriasProductos, obtenerCategoriasDistribuidores } from "@/lib/api/categorias";

type CategoriaMezclada = { id: string; nombre: string; tipo: "producto" | "distribuidor" };

let categoriasCache: CategoriaMezclada[] | null = null;
let categoriasPromise: Promise<CategoriaMezclada[]> | null = null;
let categoriasError: Error | null = null;

function useCategoriasGlobales() {
    const [categorias, setCategorias] = useState<CategoriaMezclada[] | null>(categoriasCache);

    useEffect(() => {
        if (categoriasCache !== null) {
            setCategorias(categoriasCache);
            return;
        }

        if (categoriasError !== null) {
            categoriasPromise = null;
            categoriasError = null;
        }

        if (!categoriasPromise) {
            categoriasPromise = Promise.all([
                obtenerCategoriasProductos(),
                obtenerCategoriasDistribuidores()
            ]).then(([prods, dists]) => {
                categoriasCache = [
                    ...prods.map(p => ({ ...p, tipo: "producto" as const })),
                    ...dists.map(d => ({ ...d, tipo: "distribuidor" as const }))
                ];
                return categoriasCache;
            }).catch(err => {
                categoriasError = err;
                throw err;
            });
        }

        categoriasPromise.then(res => {
            setCategorias(res);
        }).catch(() => {
            // Error manejado globalmente
            setCategorias([]);
        });
    }, []);

    return categorias;
}

export function MercadoBuscador() {
    const router = useRouter();
    const [q, setQ] = useState("");
    const categorias = useCategoriasGlobales();

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
        
        if (tipo === "producto") {
            router.push(`/mercado/productos?categoria=${id}`);
        } else {
            router.push(`/mercado/distribuidores?categoria=${id}`);
        }
    };

    // Placeholder mientras se cargan los datos de las categoriaspor primera vez
    if (categorias === null) {
        return (
            <BarraBusquedaFiltros
                placeholder="Cargando catálogo..."
                className="rounded-2xl border-stone-200 animate-pulse pointer-events-none"
                mostrarVolver={false}
                categorias={[]}
            />
        );
    }

    return (
        <BarraBusquedaFiltros
            placeholder="Buscar productos, distribuidores..."
            valorBusqueda={q}
            onBuscar={handleBuscar}
            categorias={categorias}
            onCategoriaChange={handleCategoria}
            onChange={setQ}
            className="rounded-2xl border-stone-200"
            mostrarVolver={false}
            desactivarAutoBusqueda
            
        />
    );
}
