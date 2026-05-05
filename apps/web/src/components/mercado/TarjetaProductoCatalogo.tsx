"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Loader2, Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { MONEDA } from "@/lib/api/constants";
import { agregarProductoCliente } from "@/lib/client/carrito";
import { verificarProductoEnCarrito } from "@/lib/api/carrito";
import { VentanaEmergente } from "../VentanaEmergente";
import { useIdsCarrito } from "@/lib/carrito-context";

interface TarjetaProductoCatalogoProps {
    productoId: string;
    nombre: string;
    costo: number;
    unidad: string;
    imagen: string | null;
    disponible: boolean;
}

/**
 * Tarjeta de producto simplificada para el catálogo público del mercado.
 * Solo lectura — sin controles de edición ni archivar.
 */
export function TarjetaProductoCatalogo({
    productoId,
    nombre,
    costo,
    unidad,
    imagen,
    disponible,
}: TarjetaProductoCatalogoProps) {
    const [agregando, setAgregando] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const idsCarrito = useIdsCarrito();
    const [agregado, setAgregado] = useState(() => idsCarrito.has(productoId));

    return (
        <>
            <Link
                href={`/mercado/productos/detalle?p=${productoId}`}
                className={`block bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                    !disponible ? "opacity-60" : ""
                }`}
            >
                {/* Imagen */}
                <div className="relative w-full h-36 bg-[var(--color-secondary-200)]">
                    {imagen ? (
                        <img
                            src={imagen}
                            alt={nombre}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package size={36} className="text-stone-300" />
                        </div>
                    )}
                    {!disponible && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="text-[10px] font-semibold text-white bg-black/50 px-2 py-0.5 rounded-full">
                                No disponible
                            </span>
                        </div>
                    )}
                </div>

                {/* Contenido */}
                <div className="p-3 flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                        {nombre}
                    </h3>
                    <div className="mt-auto flex items-center justify-between gap-2">
                        <p className="text-base font-bold text-[var(--color-primary-500)]">
                            ${costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {MONEDA}
                            <span className="text-xs font-normal text-stone-400 ml-0.5">/{unidad}</span>
                        </p>
                        <button
                            type="button"
                            disabled={!disponible || agregando}
                            className="rounded-full bg-[#EAE1D1] p-1.5 text-stone-700 disabled:opacity-50"
                            onClick={async (e) => {
                                e.preventDefault();
                                if (agregado)return;
                                setAgregando(true);
                                const result = await agregarProductoCliente({ productoId, cantidad: 1 });
                                setToast(result.ok ? (result.message ?? "Producto agregado") : (result.error ?? "No se pudo agregar"));
                                if (result.ok) {
                                  setAgregado(true);
                                }
                                setAgregando(false);
                            }}
                            aria-label={`Agregar ${nombre} al carrito`}
                        >
                            {agregando ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : agregado ? (
                                <ArrowUpRight size={14} className="text-green-700" />
                            ) : (
                                <ShoppingCart size={14} />
                            )}
                        </button>
                    </div>
                </div>
            </Link>
            {toast ? <VentanaEmergente mensaje={toast} onClose={() => setToast(null)} /> : null}
        </>
    );
}
