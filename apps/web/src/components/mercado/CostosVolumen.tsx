"use client";

import { useEffect, useState } from "react";
import { MONEDA } from "@/lib/api/constants";


export interface NivelPrecio {
    cantidad_minima: number;
    costo_por_medida: number;
}

interface CostosVolumenProps {
    costoBase: number;
    unidadMedida: string;
    nivelesPrecio?: NivelPrecio[];
    seleccionCantidad:(cantidad:number)=>void;
}

export function CostosVolumen({ costoBase, unidadMedida, nivelesPrecio,seleccionCantidad}: CostosVolumenProps) {
    const [selectedTier, setSelectedTier] = useState<number>(0);

    const niveles = Array.isArray(nivelesPrecio) 
        ? [...nivelesPrecio].sort((a, b) => a.cantidad_minima - b.cantidad_minima)
        : [];

    const ranges: {id: string, label: string, cost: number}[] = [];

    if (niveles.length > 0) {
        // Generar rangos crudos basados en la lógica: 
        // "si pide menos que niveles[i].cantidad_minima le cobro niveles[i].costo_por_medida"
        const raw: {min: number, max: number | null, cost: number}[] = [];
        
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
                max: niveles[i+1].cantidad_minima - 1,
                cost: niveles[i+1].costo_por_medida,

            });
        }
        
        // Último rango: desde el último nivel en adelante
        raw.push({
            min: niveles[niveles.length - 1].cantidad_minima,
            max: null,
            cost: niveles[niveles.length - 1].costo_por_medida,

        });

        // Fusionar rangos adyacentes que tengan el mismo costo
        const merged: {min: number, max: number | null, cost: number}[] = [];
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

    useEffect(()=>{
        if (!nivelesPrecio)return;
        seleccionCantidad(nivelesPrecio[selectedTier-1]?.cantidad_minima??1)
    },[selectedTier])

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
