"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";

interface BuscadorProps {
    /** Texto placeholder del input. Default: "Buscar..." */
    placeholder?: string;
    /** Valor controlado externamente. Si se omite, el componente maneja su propio estado. */
    valor?: string;
    /** Callback cuando el valor cambia (sin debounce). */
    onChange?: (valor: string) => void;
    /** Callback con debounce aplicado. Ideal para disparar búsquedas al backend. */
    onBuscar?: (query: string) => void;
    /** Tiempo de debounce en ms. Default: 300. */
    debounceMs?: number;
    /** Clases Tailwind adicionales para el contenedor raíz. */
    className?: string;
    desactivarAutoBusqueda?: boolean;
}

/**
 * `Buscador` — Input de búsqueda reutilizable con debounce integrado.
 *
 * Diseñado para ser usado en inventario, catálogo, pedidos, o cualquier
 * sección que necesite filtrado por texto. Soporta modo controlado y no controlado.
 *
 * @example
 * // Modo controlado con debounce:
 * <Buscador
 *   placeholder="Buscar productos..."
 *   valor={busqueda}
 *   onChange={setBusqueda}
 *   onBuscar={(q) => fetchProductos(q)}
 * />
 *
 * @example
 * // Modo no controlado (solo callback de búsqueda):
 * <Buscador
 *   placeholder="Buscar distribuidores..."
 *   onBuscar={(q) => console.log("Buscar:", q)}
 * />
 */
export function Buscador({
    placeholder = "Buscar...",
    valor,
    onChange,
    onBuscar,
    debounceMs = 300,
    className = "",
    desactivarAutoBusqueda = false
}: BuscadorProps) {
    const [interno, setInterno] = useState("");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Valor activo: controlado o interno
    const valorActivo = valor !== undefined ? valor : interno;

    const handleChange = useCallback(
        (nuevoValor: string) => {
            if (valor === undefined) {
                setInterno(nuevoValor);
            }
            onChange?.(nuevoValor);

            // Debounce para onBuscar
            if (desactivarAutoBusqueda) return
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                onBuscar?.(nuevoValor);
            }, debounceMs);
        },
        [valor, onChange, onBuscar, debounceMs]
    );

    const handleLimpiar = useCallback(() => {
        handleChange("");
    }, [handleChange]);

    // Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className={`flex items-center gap-2 bg-[#FCF8F4] border border-[#E8DEC1]/60 rounded-xl px-3 py-2.5 focus-within:border-[#DAA520] transition-colors ${className}`}>
            <Search size={16} className="text-stone-400 flex-shrink-0" />
            <input
                type="text"
                value={valorActivo}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        if (timerRef.current) clearTimeout(timerRef.current);
                        onBuscar?.(valorActivo);
                    }
                }}
                className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none"
            />
            {valorActivo && (
                <button
                    type="button"
                    onClick={handleLimpiar}
                    className="text-stone-400 hover:text-stone-600 transition cursor-pointer flex-shrink-0"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
