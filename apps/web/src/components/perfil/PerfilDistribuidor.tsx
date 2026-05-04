"use client";

import { PlusCircle, FileText, Users, Image as ImageIcon, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Badge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";

interface Direccion {
    id: string;
    calle: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    es_predeterminada: boolean;
}

interface Distribuidor {
    id: string;
    nombre: string;
    nombre_negocio: string;
    rfc: string;
    direcciones: Direccion[];
    imagen_perfil: string | null;
    imagen_fondo: string | null;
    valoracion_promedio: number;
    total_valoraciones: number;
    fecha_creacion: string;
}

interface Props {
    distribuidor: Distribuidor | null;
}

export default function PerfilDistribuidor({ distribuidor }: Props) {
    if (!distribuidor) return <div className="p-4 text-center text-sm text-stone-500">Cargando dashboard...</div>;

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto pb-10 bg-[#FAF7F2] min-h-screen">
            {/* Header */}
            <header className="flex flex-col items-center justify-center p-4 mb-2">
                <h1 className="text-xl font-semibold text-stone-900">Administracion</h1>
                <h2 className="font-extralight">
                    gestiona tu negocio desde un <b className="font-bold text-[var(--color-primary-500)] tracking-wider">unico</b> lugar
                </h2>
            </header>

            {/* Resumen */}
            <section className="px-4 mb-4">
                <h2 className="text-2xl font-bold text-stone-900 mb-1">Resumen</h2>
                <p className="text-sm text-stone-500">Cifras de ventas de este ultimo mes.</p>
            </section>

            {/* Stats grid */}
            <section className="px-4 flex flex-col gap-3 mb-6">
                {/* Tarjeta grande — Volumen Bruto */}
                <Tarjeta variante="calido" className="relative overflow-hidden">
                    <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2">VOLUMEN BRUTO</p>
                    <h3 className="text-4xl font-bold text-stone-900 mb-2">$84.2k</h3>
                    <p className="text-[10px] font-bold text-yellow-700 flex items-center gap-1">
                        <span>↑</span> 12 % respecto a la semana pasada
                    </p>
                    {/* Sparkline decorativo */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-24 opacity-60 pointer-events-none">
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                            <path d="M0,35 Q10,35 20,40 T40,25 T60,20 T80,10 T100,5" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <div className="flex justify-between w-full px-2 mt-1 text-[8px] text-stone-400 font-bold">
                            <span>MON</span><span>WED</span><span>SUN</span>
                        </div>
                    </div>
                </Tarjeta>

                {/* Tarjetas pequeñas */}
                <div className="flex gap-3">
                    <Tarjeta variante="calido" className="flex-1 flex flex-col justify-between min-h-[100px]">
                        <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2 leading-tight">ACTIVOS<br/>PEDIDOS</p>
                        <h3 className="text-2xl font-bold text-stone-900">142</h3>
                    </Tarjeta>
                    <Tarjeta variante="calido" className="flex-1 flex flex-col justify-between min-h-[100px]">
                        <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2 leading-tight">POCO<br/>STOCK</p>
                        <div>
                            <h3 className="text-xl font-bold text-red-700">8 artículos</h3>
                            <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">UMBRAL DEL 50</p>
                        </div>
                    </Tarjeta>
                </div>
            </section>

            {/* Acciones rápidas */}
            <section className="px-4 mb-8">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <Boton variante="chip" Icono={PlusCircle} href="/distribuidor/productos/crear" className="bg-[#DDA11E] border-transparent text-stone-900">
                        Nuevo producto
                    </Boton>
                    <Boton variante="chip" Icono={FileText}>
                        Borrador de factura
                    </Boton>
                    <Boton variante="chip" Icono={Users}>
                        Clientes
                    </Boton>
                </div>
            </section>

            {/* Alertas de existencias */}
            <section className="px-4 mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold text-stone-900">Alertas de existencias</h2>
                    <button className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1 text-right leading-tight">
                        VER<br/>TODO
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Banner resumen */}
                    <Tarjeta variante="calido" className="py-3">
                        <h4 className="text-lg font-bold text-red-700">8 artículos</h4>
                        <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">UMBRAL DEL 50</p>
                    </Tarjeta>

                    {/* Producto 1 */}
                    <Tarjeta variante="calido" conPadding={false} className="p-3 flex gap-3 items-center">
                        <div className="w-14 h-14 bg-[#DDA11E]/40 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <ImageIcon className="text-yellow-800 opacity-50" size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-stone-900 leading-tight">Tuscan Extra Virgin Oil</h4>
                            <p className="text-[10px] text-stone-500 mb-1">SKU: OLV-TUS-12PK</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800">$120.00 / case</span>
                                <Badge variante="exito" className="text-[9px] px-1.5 py-0.5">In Stock (45)</Badge>
                            </div>
                        </div>
                        <button className="text-stone-400 p-2"><MoreVertical size={16} /></button>
                    </Tarjeta>

                    {/* Producto 2 */}
                    <Tarjeta variante="calido" conPadding={false} className="p-3 flex gap-3 items-center">
                        <div className="w-14 h-14 bg-stone-200 rounded-lg flex-shrink-0 flex items-center justify-center border border-stone-300">
                            <ImageIcon className="text-stone-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-stone-900 leading-tight">Himalayan Salt 25kg</h4>
                            <p className="text-[10px] text-stone-500 mb-1">SKU: SLT-HIM-25</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800">$65.00 / unit</span>
                                <Badge variante="error" className="text-[9px] px-1.5 py-0.5">Out of Stock</Badge>
                            </div>
                        </div>
                        <button className="text-stone-400 p-2"><MoreVertical size={16} /></button>
                    </Tarjeta>
                </div>
            </section>
        </div>
    );
}
