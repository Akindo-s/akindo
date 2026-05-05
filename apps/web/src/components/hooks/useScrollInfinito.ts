"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseScrollInfinitoOptions<T> {
    /**
     * Función que fetcha una página de datos. Recibe el número de página.
     * Debe retornar `{ items: T[], tieneSiguiente: boolean }`.
     */
    fetchFn: (pagina: number) => Promise<{ items: T[]; tieneSiguiente: boolean }>;
    /**
     * Cuando cambia este valor, el hook hace reset y vuelve a cargar desde la página 1.
     * Úsalo para conectar búsqueda, filtros, etc.
     */
    resetKey?: unknown;
}

interface UseScrollInfinitoResult<T> {
    items: T[];
    cargando: boolean;
    cargandoMas: boolean;
    error: string | null;
    centinelaRef: React.RefObject<HTMLDivElement | null>;
    recargar: () => void;
}

/**
 * `useScrollInfinito` — Hook genérico de scroll infinito.
 *
 * Encapsula el patrón IntersectionObserver + paginación usado en `InventarioView.tsx`.
 * Usado tanto en el inventario privado del distribuidor como en las páginas públicas del mercado.
 *
 * @example
 * const { items, cargando, cargandoMas, centinelaRef } = useScrollInfinito({
 *   fetchFn: async (pagina) => {
 *     const data = await listarProductosCatalogo(pagina, 12, busqueda, categoriasFiltro);
 *     return { items: data.productos, tieneSiguiente: data.tiene_siguiente };
 *   },
 *   resetKey: `${busqueda}-${categoriasFiltro.join(",")}`,
 * });
 */
export function useScrollInfinito<T>({ fetchFn, resetKey }: UseScrollInfinitoOptions<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [pagina, setPagina] = useState(1);
    const [tieneSiguiente, setTieneSiguiente] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const paginaRef = useRef(1);
    const tieneSiguienteRef = useRef(false);
    const cargandoMasRef = useRef(false);

    useEffect(() => { paginaRef.current = pagina; }, [pagina]);
    useEffect(() => { tieneSiguienteRef.current = tieneSiguiente; }, [tieneSiguiente]);
    useEffect(() => { cargandoMasRef.current = cargandoMas; }, [cargandoMas]);

    const cargar = useCallback(async (pag: number, resetear = false) => {
        resetear ? setCargando(true) : setCargandoMas(true);
        setError(null);
        try {
            const { items: nuevos, tieneSiguiente: siguiente } = await fetchFn(pag);
            setItems(prev => resetear ? nuevos : [...prev, ...nuevos]);
            setTieneSiguiente(siguiente);
            setPagina(pag);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al cargar datos");
        } finally {
            setCargando(false);
            setCargandoMas(false);
        }
    }, [fetchFn, resetKey]);

    useEffect(() => {
        cargar(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    // se ejecuta cuando el elemento entra/sale del DOM
    const centinelaRef = useCallback((nodo: HTMLDivElement | null) => {
        // Limpiar observer anterior si el nodo cambia
        observerRef.current?.disconnect();

        if (!nodo) return;

        observerRef.current = new IntersectionObserver((entries) => {
            if (
                entries[0].isIntersecting &&
                tieneSiguienteRef.current &&
                !cargandoMasRef.current
            ) {
                cargar(paginaRef.current + 1);
            }
        }, { threshold: 0.1 });

        observerRef.current.observe(nodo);
    }, [cargar]);

    const recargar = useCallback(() => cargar(1, true), [cargar]);

    return { items, cargando, cargandoMas, error, centinelaRef, recargar,tieneSiguiente };
}