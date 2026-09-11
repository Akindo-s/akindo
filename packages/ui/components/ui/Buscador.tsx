/** @jsxImportSource nativewind */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";
import { Pressable } from "../html-elements";
import { fuente } from "../../fonts";

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
 * Soporta modo controlado (`valor` + `onChange`) y no controlado (solo
 * `onBuscar`). Enter busca al instante, sin esperar el debounce.
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
    // `focus-within:` y `hover:` sobre texto/íconos son CSS: con estado se ven
    // igual en las dos plataformas.
    const [enfocado, setEnfocado] = useState(false);
    const [limpiarEnHover, setLimpiarEnHover] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const valorActivo = valor !== undefined ? valor : interno;

    const onBuscarRef = useRef(onBuscar);
    useEffect(() => { onBuscarRef.current = onBuscar; }, [onBuscar]);

    const handleChange = useCallback(
        (nuevoValor: string) => {
            if (valor === undefined) setInterno(nuevoValor);
            onChange?.(nuevoValor);
            if (desactivarAutoBusqueda) return;
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                onBuscarRef.current?.(nuevoValor);
            }, debounceMs);
        },
        [valor, onChange, debounceMs, desactivarAutoBusqueda]
    );

    const handleLimpiar = useCallback(() => {
        handleChange("");
    }, [handleChange]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <View className={`flex flex-row items-center gap-2 bg-[#FCF8F4] border ${enfocado ? "border-[#DAA520]" : "border-[#E8DEC1]/60"} rounded-xl px-3 py-2.5 transition-colors ${className}`}>
            {/* #A8A29E = text-stone-400: en nativo `currentColor` sale negro. */}
            <Search size={16} color="#A8A29E" style={{ flexShrink: 0 }} />
            <TextInput
                style={fuente()}
                value={valorActivo}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor="#A8A29E"
                onFocus={() => setEnfocado(true)}
                onBlur={() => setEnfocado(false)}
                returnKeyType="search"
                // Enter en web, "Buscar" del teclado en nativo.
                onSubmitEditing={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    onBuscarRef.current?.(valorActivo);
                }}
                className="flex-1 bg-transparent text-sm text-stone-800 outline-none p-0"
            />
            {valorActivo ? (
                <Pressable
                    role="button"
                    accessibilityLabel="Limpiar búsqueda"
                    onPress={handleLimpiar}
                    onHoverIn={() => setLimpiarEnHover(true)}
                    onHoverOut={() => setLimpiarEnHover(false)}
                    className="transition cursor-pointer flex-shrink-0"
                >
                    {/* text-stone-400, y text-stone-600 en hover. */}
                    <X size={14} color={limpiarEnHover ? "#57534E" : "#A8A29E"} />
                </Pressable>
            ) : null}
        </View>
    );
}
