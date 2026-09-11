/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { View } from "react-native";
import { MONEDA } from "@akindo/shared/constants";
import type { NivelPrecio } from "@akindo/shared/api/productos";
import { H3, P, Pressable, Span } from "../html-elements";

export type { NivelPrecio };

interface CostosVolumenProps {
    costoBase: number;
    unidadMedida: string;
    nivelesPrecio?: NivelPrecio[];
    seleccionCantidad: (cantidad: number) => void;
}

export function CostosVolumen({ unidadMedida, nivelesPrecio, seleccionCantidad }: CostosVolumenProps) {
    const [selectedTier, setSelectedTier] = useState<number>(0);
    // `hover:border-stone-200` con estado: ver ChipFiltro.
    const [tierEnHover, setTierEnHover] = useState<number | null>(null);

    // Antes del `return null` de abajo: en el original este efecto iba después
    // (un hook condicional). La lógica es la misma.
    useEffect(() => {
        if (!nivelesPrecio) return;
        seleccionCantidad(nivelesPrecio[selectedTier - 1]?.cantidad_minima ?? 1)
    }, [selectedTier])

    const niveles = Array.isArray(nivelesPrecio)
        ? [...nivelesPrecio].sort((a, b) => a.cantidad_minima - b.cantidad_minima)
        : [];

    const ranges: { id: string, label: string, cost: number }[] = [];

    if (niveles.length > 0) {
        // Generar rangos crudos basados en la lógica:
        // "si pide menos que niveles[i].cantidad_minima le cobro niveles[i].costo_por_medida"
        const raw: { min: number, max: number | null, cost: number }[] = [];

        // Primer rango: desde 1 hasta justo antes del primer nivel
        if (niveles[0].cantidad_minima > 1) {
            raw.push({
                min: 1,
                max: niveles[0].cantidad_minima - 1,
                cost: niveles[0].costo_por_medida
            });
        }

        // Rangos intermedios: desde un nivel hasta justo antes del siguiente
        for (let i = 0; i < niveles.length - 1; i++) {
            raw.push({
                min: niveles[i].cantidad_minima,
                max: niveles[i + 1].cantidad_minima - 1,
                cost: niveles[i + 1].costo_por_medida,
            });
        }

        // Último rango: desde el último nivel en adelante
        raw.push({
            min: niveles[niveles.length - 1].cantidad_minima,
            max: null,
            cost: niveles[niveles.length - 1].costo_por_medida,
        });

        // Fusionar rangos adyacentes que tengan el mismo costo
        const merged: { min: number, max: number | null, cost: number }[] = [];
        for (const r of raw) {
            const last = merged[merged.length - 1];
            if (last && last.cost === r.cost) {
                last.max = r.max;
            } else {
                merged.push({ ...r });
            }
        }

        // Convertir a formato de visualización
        merged.forEach((r, idx) => {
            let label = "";
            if (r.max === null) {
                label = `${r.min}+ ${unidadMedida}`;
            } else if (r.min === r.max) {
                label = `${r.min} ${unidadMedida}`;
            } else {
                label = `${r.min} - ${r.max} ${unidadMedida}`;
            }

            ranges.push({
                id: `tier-${idx}`,
                label,
                cost: r.cost,
            });
        });
    }

    if (ranges.length === 0) return null;

    return (
        <View className="bg-white p-5 md:p-6 shadow-sm border-y border-stone-100 mx-0 lg:mx-4 lg:rounded-2xl lg:border lg:mb-4">
            {/* tracking-wide = 0.025em; a 14px son 0.35px. */}
            <H3 peso="bold" className="text-sm text-stone-800 mb-4 uppercase tracking-[0.35px]">
                Costos por volumen
            </H3>
            <View className="flex flex-col gap-3">
                {ranges.map((range, idx) => {
                    const isSelected = selectedTier === idx;
                    const color = isSelected ? "text-[#DAA520]" : "text-stone-900";
                    return (
                        <Pressable
                            key={range.id}
                            onPress={() => setSelectedTier(idx)}
                            onHoverIn={() => setTierEnHover(idx)}
                            onHoverOut={() => setTierEnHover(null)}
                            className={`relative flex flex-row items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                                isSelected
                                    ? "border-[#DAA520]"
                                    : tierEnHover === idx ? "border-stone-200" : "border-stone-100"
                            }`}
                        >
                            {/* Borde lateral izquierdo dorado */}
                            {isSelected && (
                                <View className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#DAA520] rounded-r-md" />
                            )}

                            {/* Tooltip con 'S' */}
                            {isSelected && (
                                <View className="absolute -top-[14px] right-[4.5rem] bg-stone-800 w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10 border border-stone-700">
                                    <Span peso="bold" className="text-[10px] leading-normal text-[#DAA520]">S</Span>
                                    {/* Triángulo con bordes. `-translate-x-1/2` (porcentaje) no existe
                                        en nativo: el triángulo mide 8px, así que va -ml-1. */}
                                    <View className="absolute -bottom-1.5 left-1/2 -ml-1 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-stone-800" />
                                </View>
                            )}

                            <Span peso="medium" className={`text-lg pl-2 ${isSelected ? "text-[#DAA520]" : "text-stone-600"}`}>
                                {range.label}
                            </Span>
                            {/* shrink: en CSS este bloque se encoge y parte la línea. */}
                            <P peso="bold" className={`text-3xl text-right shrink ${color}`}>
                                ${range.cost.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {MONEDA}
                                <Span peso="semibold" className={`text-xs ml-1 ${color}`}>
                                    /{unidadMedida}
                                </Span>
                            </P>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
