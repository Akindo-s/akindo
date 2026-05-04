"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, PiggyBank, Truck, List, Settings, HelpCircle } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { CampoEditable } from "@/components/ui/CampoEditable";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { ItemMenu } from "@/components/ui/ItemMenu";
import { Badge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { actualizarPerfilCliente } from "@/lib/api/usuario";

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
    const router = useRouter();
    const [email, setEmail] = useState(cliente?.email || "");
    const [phone, setPhone] = useState(cliente?.telefono || "");
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const [isSavingPhone, setIsSavingPhone] = useState(false);

    if (!cliente) return <div className="p-4 text-center text-sm text-stone-500">Cargando perfil...</div>;

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
    };

    const handleSaveEmail = async () => {
        setIsSavingEmail(true);
        await actualizarPerfilCliente({ email });
        setIsSavingEmail(false);
    };

    const handleSavePhone = async () => {
        setIsSavingPhone(true);
        await actualizarPerfilCliente({ telefono: phone });
        setIsSavingPhone(false);
    };

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto pb-10">
            <EncabezadoPagina titulo="Perfil" href="/" className="mb-6" />

            {/* Avatar & Name */}
            <section className="flex flex-col items-center px-4 mb-8">
                <Avatar editable={true} nameInput="avatar" urlPreview={cliente.imagen_perfil} />
                <h2 className="text-xl font-semibold text-stone-900 mt-2">{cliente.nombre || "Usuario"}</h2>
                <span className="text-sm text-stone-500 mb-3">
                    {cliente.es_verificado ? "Cliente verificado" : "Cliente"}
                </span>
                <div className="flex gap-2">
                    <Badge variante="oro">✓ Nivel Premium</Badge>
                    <Badge variante="neutro">Miembro desde 2021</Badge>
                </div>
            </section>

            {/* Stats */}
            <section className="flex gap-4 px-4 mb-6">
                <Tarjeta className="flex-1">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center mb-3 text-yellow-600">
                        <ShoppingBag size={18} />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900">142</h3>
                    <p className="text-xs text-stone-500">Pedidos totales</p>
                </Tarjeta>
                <Tarjeta className="flex-1">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center mb-3 text-yellow-600">
                        <PiggyBank size={18} />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900">$4.2k</h3>
                    <p className="text-xs text-stone-500">Ahorrado este año</p>
                </Tarjeta>
            </section>

            {/* Información de contacto */}
            <section className="px-4 mb-6">
                <Tarjeta>
                    <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2 mb-4">
                        <span className="text-yellow-600"><Settings size={20} /></span>
                        Información de contacto
                    </h3>
                    <div className="flex flex-col gap-4">
                        <CampoEditable
                            label="Correo Electrónico"
                            value={email}
                            onChange={setEmail}
                            onSave={handleSaveEmail}
                            onCancel={() => setEmail(cliente.email)}
                            isSaving={isSavingEmail}
                            type="email"
                            borde
                        />
                        <CampoEditable
                            label="Teléfono"
                            value={phone}
                            onChange={setPhone}
                            onSave={handleSavePhone}
                            onCancel={() => setPhone(cliente.telefono || "")}
                            isSaving={isSavingPhone}
                            type="tel"
                            placeholder="No especificado"
                        />
                    </div>
                </Tarjeta>
            </section>

            {/* Direcciones de entrega */}
            <section className="px-4 mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                        <span className="text-yellow-600"><Truck size={20} /></span>
                        Direcciones de entrega
                    </h3>
                    <button className="text-sm text-yellow-600 font-medium">+ Agregar nueva</button>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="border border-yellow-400 bg-yellow-50 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-stone-900 text-sm">Tienda principal</h4>
                            <Badge variante="oro" className="text-[9px] px-2 py-0.5 rounded font-bold uppercase">Predeterminada</Badge>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed max-w-[80%]">
                            Av. Insurgentes Sur 1234, Col. Del Valle<br />Benito Juárez, CDMX 03100
                        </p>
                    </div>
                    <div className="border border-stone-200 bg-white p-4 rounded-xl">
                        <h4 className="font-bold text-stone-900 text-sm mb-1">Almacén B</h4>
                        <p className="text-xs text-stone-500 leading-relaxed max-w-[80%]">
                            Calle Norte 45 #890, Industrial Vallejo<br />Azcapotzalco, CDMX 02300
                        </p>
                    </div>
                </div>
            </section>

            {/* Menú de Ajustes */}
            <section className="px-4 mb-8">
                <Tarjeta conPadding={false} className="overflow-hidden flex flex-col">
                    <ItemMenu Icono={List} label="Mis pedidos" href="/pedidos" borde />
                    <ItemMenu Icono={Settings} label="Ajustes" href="/ajustes" borde />
                    <ItemMenu Icono={HelpCircle} label="Centro de ayuda" href="/ayuda" />
                </Tarjeta>
            </section>

            {/* Cerrar sesión */}
            <div className="px-4 flex justify-center mb-8">
                <Boton variante="peligro" onClick={handleLogout}>
                    Cerrar sesión
                </Boton>
            </div>
        </div>
    );
}
