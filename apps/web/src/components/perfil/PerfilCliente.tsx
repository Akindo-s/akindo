"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { Titulo, SubTitulo } from "@/components/titles";
import { ArrowLeft, Edit2, ShoppingBag, PiggyBank, Truck, List, Settings, HelpCircle, LogOut } from "lucide-react";
import Link from "next/link";

interface Cliente {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    imagen_perfil: string | null;
    es_verificado: boolean;
}

interface Props {
    cliente: Cliente | null;
}

export default function PerfilCliente({ cliente }: Props) {
    if (!cliente) return <div className="p-4 text-center text-sm text-stone-500">Cargando perfil...</div>;

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto pb-10">
            {/* Header */}
            <header className="flex items-center justify-center p-4 relative mb-6">
                <Link href="/" className="absolute left-4 text-stone-800 cursor-pointer">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-sm font-bold tracking-widest text-stone-900 uppercase">Perfil</h1>
            </header>

            {/* Avatar & Name Info */}
            <section className="flex flex-col items-center px-4 mb-8">
                <div className="relative">
                    <Avatar editable={true} nameInput="avatar" urlPreview={cliente.imagen_perfil} />
                </div>
                <h2 className="text-xl font-semibold text-stone-900 mt-2">{cliente.nombre || "Usuario"}</h2>
                <span className="text-sm text-stone-500 mb-3">{cliente.es_verificado ? "Cliente verificado" : "Cliente"}</span>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1">
                        <span className="text-yellow-600">✓</span> Nivel Premium
                    </div>
                    <div className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded-full">
                        Miembro desde 2021
                    </div>
                </div>
            </section>

            {/* Stats Row */}
            <section className="flex gap-4 px-4 mb-6">
                <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center mb-3 text-yellow-600">
                        <ShoppingBag size={18} />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900">142</h3>
                    <p className="text-xs text-stone-500">142 Pedidos totales</p>
                </div>
                <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center mb-3 text-yellow-600">
                        <PiggyBank size={18} />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900">$4.2k</h3>
                    <p className="text-xs text-stone-500">$4.2k Ahorrado este año</p>
                </div>
            </section>

            {/* Información de contacto */}
            <section className="px-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                    <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2 mb-4">
                        <div className="text-yellow-600"><Settings size={20} /></div> Información de contacto
                    </h3>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                            <div>
                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Correo Electrónico</p>
                                <p className="text-sm text-stone-900">{cliente.email}</p>
                            </div>
                            <button className="text-yellow-600 p-2"><Edit2 size={18} /></button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Teléfono</p>
                                <p className="text-sm text-stone-900">{cliente.telefono || "No especificado"}</p>
                            </div>
                            <button className="text-yellow-600 p-2"><Edit2 size={18} /></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Direcciones de entrega */}
            <section className="px-4 mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                        <div className="text-yellow-600"><Truck size={20} /></div> Direcciones de entrega
                    </h3>
                    <button className="text-sm text-yellow-600 font-medium">+ Agregar nueva</button>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="border border-yellow-400 bg-yellow-50 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-stone-900 text-sm">Tienda principal</h4>
                            <span className="text-[9px] font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded">PREDETERMINADA</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed max-w-[80%]">Av. Insurgentes Sur 1234, Col. Del Valle<br />Benito Juárez, CDMX 03100</p>
                    </div>
                    
                    <div className="border border-stone-200 bg-white p-4 rounded-xl">
                        <h4 className="font-bold text-stone-900 text-sm mb-1">Almacén B</h4>
                        <p className="text-xs text-stone-500 leading-relaxed max-w-[80%]">Calle Norte 45 #890, Industrial Vallejo<br />Azcapotzalco, CDMX 02300</p>
                    </div>
                </div>
            </section>

            {/* Menú de Ajustes */}
            <section className="px-4 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
                    <button className="flex items-center justify-between p-4 border-b border-stone-100 hover:bg-stone-50 transition text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                                <List size={18} />
                            </div>
                            <span className="font-semibold text-stone-800 text-sm">Mis pedidos</span>
                        </div>
                        <span className="text-stone-400">›</span>
                    </button>

                    <button className="flex items-center justify-between p-4 border-b border-stone-100 hover:bg-stone-50 transition text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                                <Settings size={18} />
                            </div>
                            <span className="font-semibold text-stone-800 text-sm">Ajustes</span>
                        </div>
                        <span className="text-stone-400">›</span>
                    </button>

                    <button className="flex items-center justify-between p-4 hover:bg-stone-50 transition text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                                <HelpCircle size={18} />
                            </div>
                            <span className="font-semibold text-stone-800 text-sm">Centro de ayuda</span>
                        </div>
                        <span className="text-stone-400">›</span>
                    </button>
                </div>
            </section>

            {/* Logout */}
            <div className="px-4 flex justify-center mb-8">
                <button className="text-red-600 font-medium text-sm px-6 py-2 border border-red-200 rounded-full hover:bg-red-50 transition">
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}
