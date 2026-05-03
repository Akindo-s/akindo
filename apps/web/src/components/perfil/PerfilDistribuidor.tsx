"use client";

import { ArrowLeft, MoreVertical, PlusCircle, FileText, Users, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

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
            <header className="flex items-center justify-between p-4 mb-2">
                <Link href="/" className="text-stone-800 cursor-pointer">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-lg font-semibold text-stone-900">Administracion</h1>
                <button className="text-stone-800">
                    <MoreVertical size={24} />
                </button>
            </header>

            {/* Resumen Title */}
            <section className="px-4 mb-4">
                <h2 className="text-2xl font-bold text-stone-900 mb-1">Resumen</h2>
                <p className="text-sm text-stone-500">Cifras de ventas de este ultimo mes.</p>
            </section>

            {/* Stats grid */}
            <section className="px-4 flex flex-col gap-3 mb-6">
                {/* Large Card */}
                <div className="bg-[#F3EBE0] p-5 rounded-2xl relative overflow-hidden border border-[#E8DEC1]">
                    <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2">VOLUMEN BRUTO</p>
                    <h3 className="text-4xl font-bold text-stone-900 mb-2">$84.2k</h3>
                    <p className="text-[10px] font-bold text-yellow-700 flex items-center gap-1">
                        <span>↑</span> 12 % respecto a la semana pasada
                    </p>
                    
                    {/* Fake Sparkline Chart background */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-24 opacity-60 pointer-events-none">
                        <svg viewBox="0 0 100 50" className="w-full h-full preserve-aspect-ratio-none">
                            <path d="M0,35 Q10,35 20,40 T40,25 T60,20 T80,10 T100,5" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <div className="flex justify-between w-full px-2 mt-1 text-[8px] text-stone-400 font-bold">
                            <span>MON</span><span>WED</span><span>SUN</span>
                        </div>
                    </div>
                </div>

                {/* Small Cards Row */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-[#F3EBE0] p-4 rounded-xl border border-[#E8DEC1] flex flex-col justify-between min-h-[100px]">
                        <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2 leading-tight w-1/2">ACTIVOS<br/>PEDIDOS</p>
                        <h3 className="text-2xl font-bold text-stone-900">142</h3>
                    </div>
                    <div className="flex-1 bg-[#F3EBE0] p-4 rounded-xl border border-[#E8DEC1] flex flex-col justify-between min-h-[100px]">
                        <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2 leading-tight w-1/2">POCO<br/>STOCK</p>
                        <div>
                            <h3 className="text-xl font-bold text-red-700">8 artículos</h3>
                            <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">UMBRAL DEL 50</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Action Buttons Scrollable */}
            <section className="px-4 mb-8">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <button className="flex items-center gap-2 bg-[#DDA11E] text-stone-900 px-4 py-2.5 rounded-full font-medium text-xs whitespace-nowrap shadow-sm">
                        <PlusCircle size={16} /> Nuevo producto
                    </button>
                    <button className="flex items-center gap-2 bg-transparent border border-[#E8DEC1] text-stone-800 px-4 py-2.5 rounded-full font-medium text-xs whitespace-nowrap">
                        <FileText size={16} /> Borrador de factura
                    </button>
                    <button className="flex items-center gap-2 bg-transparent border border-[#E8DEC1] text-stone-800 px-4 py-2.5 rounded-full font-medium text-xs whitespace-nowrap">
                        <Users size={16} /> Clientes
                    </button>
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
                    {/* Alert banner */}
                    <div className="bg-[#F3EBE0] rounded-xl p-3 border border-[#E8DEC1]">
                        <h4 className="text-lg font-bold text-red-700">8 artículos</h4>
                        <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">UMBRAL DEL 50</p>
                    </div>

                    {/* Product List */}
                    <div className="bg-[#F3EBE0] rounded-xl p-3 flex gap-3 items-center border border-[#E8DEC1]">
                        <div className="w-14 h-14 bg-[#DDA11E]/40 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <ImageIcon className="text-yellow-800 opacity-50" size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-stone-900 leading-tight">Tuscan Extra Virgin Oil</h4>
                            <p className="text-[10px] text-stone-500 mb-1">SKU: OLV-TUS-12PK</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800">$120.00 / case</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded">In Stock (45)</span>
                            </div>
                        </div>
                        <button className="text-stone-400 p-2"><MoreVertical size={16} /></button>
                    </div>

                    <div className="bg-[#F3EBE0] rounded-xl p-3 flex gap-3 items-center border border-[#E8DEC1]">
                        <div className="w-14 h-14 bg-stone-200 rounded-lg flex-shrink-0 flex items-center justify-center border border-stone-300">
                            <ImageIcon className="text-stone-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-stone-900 leading-tight">Himalayan Salt 25kg</h4>
                            <p className="text-[10px] text-stone-500 mb-1">SKU: SLT-HIM-25</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800">$65.00 / unit</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded">Out of Stock</span>
                            </div>
                        </div>
                        <button className="text-stone-400 p-2"><MoreVertical size={16} /></button>
                    </div>
                </div>
            </section>
        </div>
    );
}
