"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

/**
 * Opción para el Selector. Cada opción tiene un valor único y una etiqueta visible.
 */
export interface OpcionSelector {
    valor: string;
    etiqueta: string;
}

interface SelectorBaseProps {
    /** Etiqueta visible arriba del selector. */
    label?: string;
    /** Texto placeholder cuando no hay selección. */
    placeholder?: string;
    /** Lista de opciones disponibles. */
    opciones: OpcionSelector[];
    /** Clases Tailwind adicionales para el contenedor raíz. */
    className?: string;
    /** Marcar como requerido (muestra asterisco rojo). */
    requerido?: boolean;
}

interface SelectorSimpleProps extends SelectorBaseProps {
    /**
     * Modo de selección.
     * - `"simple"`: Solo se puede seleccionar una opción (dropdown clásico).
     */
    modo: "simple";
    /** Valor actualmente seleccionado (string). */
    valor: string;
    /** Callback cuando el valor cambia. */
    onChange: (valor: string) => void;
}

interface SelectorMultipleProps extends SelectorBaseProps {
    /**
     * Modo de selección.
     * - `"multiple"`: Permite seleccionar varias opciones. Las selecciones se muestran como chips.
     */
    modo: "multiple";
    /** Valores actualmente seleccionados (array de strings). */
    valor: string[];
    /** Callback cuando los valores cambian. */
    onChange: (valores: string[]) => void;
}

type SelectorProps = SelectorSimpleProps | SelectorMultipleProps;

/**
 * `Selector` — Componente dropdown reutilizable con soporte para selección simple y múltiple.
 *
 * En modo `"simple"`, funciona como un dropdown clásico de una sola opción.
 * En modo `"multiple"`, permite seleccionar varias opciones que se muestran como chips
 * removibles debajo del dropdown.
 *
 * @example
 * // Selector simple (una opción):
 * <Selector
 *   modo="simple"
 *   label="Unidad de medida"
 *   placeholder="Seleccionar unidad"
 *   opciones={[{ valor: "kg", etiqueta: "Kilogramo" }]}
 *   valor={medida}
 *   onChange={setMedida}
 *   requerido
 * />
 *
 * @example
 * // Selector múltiple (varias opciones con chips):
 * <Selector
 *   modo="multiple"
 *   label="Categorías"
 *   placeholder="Seleccionar categorías"
 *   opciones={categorias}
 *   valor={categoriasSeleccionadas}
 *   onChange={setCategoriasSeleccionadas}
 * />
 */
export function Selector(props: SelectorProps) {
    const { label, placeholder = "Seleccionar...", opciones, className = "", requerido } = props;
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickFuera = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    const esMultiple = props.modo === "multiple";

    // ── Texto que se muestra en el trigger ─────────────────────────────────
    const textoVisible = (() => {
        if (esMultiple) {
            const vals = (props as SelectorMultipleProps).valor;
            if (vals.length === 0) return placeholder;
            return `${vals.length} seleccionada${vals.length > 1 ? "s" : ""}`;
        }
        const val = (props as SelectorSimpleProps).valor;
        if (!val) return placeholder;
        return opciones.find((o) => o.valor === val)?.etiqueta ?? val;
    })();

    const sinSeleccion = esMultiple
        ? (props as SelectorMultipleProps).valor.length === 0
        : !(props as SelectorSimpleProps).valor;

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleSeleccionar = (opcion: OpcionSelector) => {
        if (esMultiple) {
            const multiProps = props as SelectorMultipleProps;
            const existe = multiProps.valor.includes(opcion.valor);
            if (existe) {
                multiProps.onChange(multiProps.valor.filter((v) => v !== opcion.valor));
            } else {
                multiProps.onChange([...multiProps.valor, opcion.valor]);
            }
        } else {
            (props as SelectorSimpleProps).onChange(opcion.valor);
            setAbierto(false);
        }
    };

    const handleRemoverChip = (valor: string) => {
        if (esMultiple) {
            const multiProps = props as SelectorMultipleProps;
            multiProps.onChange(multiProps.valor.filter((v) => v !== valor));
        }
    };

    const estaSeleccionado = (valor: string): boolean => {
        if (esMultiple) return (props as SelectorMultipleProps).valor.includes(valor);
        return (props as SelectorSimpleProps).valor === valor;
    };

    return (
        <div ref={contenedorRef} className={`flex flex-col gap-1 w-full relative ${className}`}>
            {label && (
                <label className="text-xs font-medium text-stone-600 select-none">
                    {label} {requerido && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setAbierto(!abierto)}
                className={`
                    w-full flex items-center justify-between
                    bg-[#FCF8F4] border rounded-xl px-3 py-2.5 text-sm text-left
                    focus:outline-none transition cursor-pointer
                    ${abierto ? "border-[#DAA520]" : "border-[#E8DEC1]/60"}
                    ${sinSeleccion ? "text-stone-400" : "text-stone-800"}
                `}
            >
                <span className="truncate">{textoVisible}</span>
                <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-stone-400 transition-transform ${abierto ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown */}
            {abierto && (
                <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border border-[#E8DEC1] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {opciones.map((opcion) => {
                        const seleccionado = estaSeleccionado(opcion.valor);
                        return (
                            <button
                                key={opcion.valor}
                                type="button"
                                onClick={() => handleSeleccionar(opcion)}
                                className={`
                                    w-full text-left px-3 py-2.5 text-sm transition
                                    hover:bg-[#FDF2E3] cursor-pointer flex items-center justify-between
                                    first:rounded-t-xl last:rounded-b-xl
                                    ${seleccionado ? "bg-[#FDF2E3] text-[#DAA520] font-medium" : "text-stone-700"}
                                `}
                            >
                                <span>{opcion.etiqueta}</span>
                                {esMultiple && seleccionado && (
                                    <span className="text-[#DAA520] text-xs font-bold">✓</span>
                                )}
                            </button>
                        );
                    })}
                    {opciones.length === 0 && (
                        <div className="px-3 py-2.5 text-sm text-stone-400 text-center">Sin opciones</div>
                    )}
                </div>
            )}

            {/* Chips de selección múltiple */}
            {esMultiple && (props as SelectorMultipleProps).valor.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {(props as SelectorMultipleProps).valor.map((val) => {
                        const opcion = opciones.find((o) => o.valor === val);
                        return (
                            <span
                                key={val}
                                className="inline-flex items-center gap-1 bg-[#FDF2E3] text-[#9A7B24] border border-[#E8DEC1] rounded-full px-2.5 py-0.5 text-xs font-medium"
                            >
                                {opcion?.etiqueta ?? val}
                                <button
                                    type="button"
                                    onClick={() => handleRemoverChip(val)}
                                    className="hover:text-red-500 transition cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
