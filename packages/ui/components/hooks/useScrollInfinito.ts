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

/**
 * `useScrollInfinito` — paginación para scroll infinito.
 *
 * Misma lógica que `apps/web/src/components/hooks/useScrollInfinito.ts`, sin
 * el IntersectionObserver: en vez de un ref al DOM devuelve `cargarSiguiente`,
 * que se conecta a un `<Centinela onVisible={cargarSiguiente}>` (ver
 * ContenedorPantalla.tsx), que sabe detectar el final en cada plataforma.
 */
export function useScrollInfinito<T>({ fetchFn, resetKey }: UseScrollInfinitoOptions<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [pagina, setPagina] = useState(1);
    const [tieneSiguiente, setTieneSiguiente] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    /** Lo que antes hacía el callback del IntersectionObserver. */
    const cargarSiguiente = useCallback(() => {
        if (tieneSiguienteRef.current && !cargandoMasRef.current) {
            // Ya, sin esperar al render: en nativo el aviso de fin de scroll
            // llega varias veces seguidas y pedía la misma página dos veces.
            cargandoMasRef.current = true;
            cargar(paginaRef.current + 1);
        }
    }, [cargar]);

    const recargar = useCallback(() => cargar(1, true), [cargar]);

    return { items, cargando, cargandoMas, error, cargarSiguiente, recargar, tieneSiguiente };
}
