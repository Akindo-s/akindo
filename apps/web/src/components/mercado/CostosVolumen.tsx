"use client";

import { useState } from "react";
import { MONEDA } from "@/lib/api/constants";


export interface NivelPrecio {
    cantidad_minima: number;
    costo_por_medida: number;
}

interface CostosVolumenProps {
    costoBase: number;
    unidadMedida: string;
    nivelesPrecio?: NivelPrecio[];
}

export function CostosVolumen({ costoBase, unidadMedida, nivelesPrecio }: CostosVolumenProps) {
    const [selectedTier, setSelectedTier] = useState<number>(0);

    const niveles = Array.isArray(nivelesPrecio) 
        ? [...nivelesPrecio].sort((a, b) => a.cantidad_minima - b.cantidad_minima)
        : [];

    const ranges: {id: string, label: string, cost: number}[] = [];

    if (niveles.length > 0) {
        if (niveles[0].cantidad_minima > 1) {
            ranges.push({
                id: 'base',
                label: `1 - ${niveles[0].cantidad_minima - 1} ${unidadMedida}`,
                cost: costoBase,
            });
        }

        niveles.forEach((nivel, idx) => {
            const nextNivel = niveles[idx + 1];
            if (nextNivel) {
                ranges.push({
                    id: `tier-${idx}`,
                    label: `${nivel.cantidad_minima} - ${nextNivel.cantidad_minima - 1} ${unidadMedida}`,
                    cost: nivel.costo_por_medida,
                });
            } else {
                ranges.push({
                    id: `tier-${idx}`,
                    label: `${nivel.cantidad_minima}+ ${unidadMedida}`,
                    cost: nivel.costo_por_medida,
                });
            }
        });
    }

    if (ranges.length === 0) return null;

    return (
        <div className="bg-white p-5 md:p-6 shadow-sm border-y border-stone-100 mx-0 lg:mx-4 lg:rounded-2xl lg:border lg:mb-4">
            <h3 className="text-sm font-bold text-stone-800 mb-4 uppercase tracking-wide">
                Costos por volumen
            </h3>
            <div className="flex flex-col gap-3">
                {ranges.map((range, idx) => {
                    const isSelected = selectedTier === idx;
                    return (
                        <div 
                            key={range.id}
                            onClick={() => setSelectedTier(idx)}
                            className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                isSelected 
                                    ? "border-[#DAA520] bg-white" 
                                    : "border-stone-100 bg-white hover:border-stone-200"
                            }`}
                        >
                            {/* Borde lateral izquierdo dorado */}
                            {isSelected && (
                                <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#DAA520] rounded-r-md"></div>
                            )}
                            
                            {/* Tooltip con 'S' */}
                            {isSelected && (
                                <div className="absolute -top-[14px] right-[4.5rem] bg-stone-800 text-[#DAA520] text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10 border border-stone-700">
                                    S
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-stone-800"></div>
                                </div>
                            )}

                            <span className={`text-lg font-medium pl-2 ${isSelected ? "text-[#DAA520]" : "text-stone-600"}`}>
                                {range.label}
                            </span>
                            <div className="text-right">
                                <span className={`text-3xl font-bold ${isSelected ? "text-[#DAA520]" : "text-stone-900"}`}>
                                    ${range.cost.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {MONEDA}
                                </span>
                                <span className={`text-xs ml-1 font-semibold ${isSelected ? "text-[#DAA520]" : "text-stone-900"}`}>
                                    /{unidadMedida}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
