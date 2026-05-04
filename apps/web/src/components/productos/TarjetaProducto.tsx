"use client";

import { useRouter } from "next/navigation";
import { Archive, Edit3, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { useEffect } from "react";

export interface ProductoInventario {
    producto_id: string;
    nombre: string;
    costo: number;
    disponible: boolean;
    unidad: string;
    existencias?: number;
    imagen?: string | null;
}

interface TarjetaProductoProps {
    /** Datos del producto a mostrar. */
    producto: ProductoInventario;
    /** Callback cuando se presiona "Archivar". */
    onArchivar?: (productoId: string) => void;
    /** Callback cuando se cambia la disponibilidad del producto. */
    onToggleDisponible?: (productoId: string, nuevoEstado: boolean) => void;
    /** Clases Tailwind adicionales. */
    className?: string;
}

/**
 * `TarjetaProducto` — Tarjeta de producto para la vista de inventario del distribuidor.
 *
 * Muestra imagen, nombre, badge de stock, precio, y acciones (editar, archivar).
 * Soporta toggle de disponibilidad directamente desde la tarjeta.
 *
 * @example
 * <TarjetaProducto
 *   producto={{ producto_id: "...", nombre: "Café", costo: 245, disponible: true, unidad: "kg", existencias: 150 }}
 *   onArchivar={(id) => archivarProducto(id)}
 *   onToggleDisponible={(id, estado) => toggleDisponible(id, estado)}
 * />
 */
export function TarjetaProducto({
    producto,
    onArchivar,
    onToggleDisponible,
    className = "",
}: TarjetaProductoProps) {
    const router = useRouter();

    // Determinar estado de stock
    const existencias = producto.existencias ?? 0;
    const stockBajo = existencias > 0 && existencias <= 15;
    const sinStock = existencias === 0;

    const badgeVariante = sinStock ? "error" : stockBajo ? "advertencia" : "exito";
    const badgeTexto = sinStock ? "Sin Stock" : stockBajo ? "Bajo Stock" : "En Stock";
    useEffect(()=>{
        console.log(producto)
    },[])
    return (
        <div className={`bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden ${className}`}>
            {/* Imagen */}
            <div className="relative w-full h-44 bg-[#F3EBE0]">
                {producto.imagen ? (
                    <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={40} className="text-stone-300" />
                    </div>
                )}
                {/* Badge de stock */}
                <div className="absolute top-2.5 right-2.5">
                    <Badge variante={badgeVariante}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1" />
                        {badgeTexto}
                    </Badge>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-4 flex flex-col gap-1.5">
                <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                    {producto.nombre}
                </h3>

                <p className={`text-xs font-medium ${sinStock ? "text-red-500" : stockBajo ? "text-orange-500" : "text-stone-500"}`}>
                    Existencias: {existencias} {producto.unidad}
                </p>

                <div className="flex items-end justify-between mt-1">
                    <p className="text-lg font-bold text-[#DAA520]">
                        ${producto.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-stone-400 ml-0.5">/{producto.unidad}</span>
                    </p>

                    <div className="flex items-center gap-1.5">
                        {/* Editar */}
                        <Boton
                            variante="chip"
                            Icono={Edit3}
                            iconoSize={14}
                            onClick={() => router.push(`/distribuidor/productos/${producto.producto_id}/editar`)}
                            className="p-1.5 border-transparent text-stone-500 hover:text-[#DAA520] hover:bg-[#FDF2E3]"
                        />

                        {/* Archivar */}
                        {onArchivar && (
                            <Boton
                                variante="chip"
                                Icono={Archive}
                                iconoSize={14}
                                onClick={() => onArchivar(producto.producto_id)}
                                className="p-1.5 border-transparent text-stone-400 hover:text-red-400 hover:bg-red-50"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
