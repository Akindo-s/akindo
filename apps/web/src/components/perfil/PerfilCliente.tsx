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
import { actualizarPerfilCliente, obtenerMisDirecciones, crearDireccion, actualizarDireccion, eliminarDireccion } from "@/lib/api/usuario";
import { Parrafo, SubTitulo } from "../titles";
import useSWR from "swr";
import { Trash2, Edit3 } from "lucide-react";

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

function EstadisticasCliente() {
    return (
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
    )
}

function EtiquetasClientes() {
    return (
        <>
            <Badge variante="oro">✓ Nivel Premium</Badge>
            <Badge variante="neutro">Miembro desde 2021</Badge>
        </>
    )
}

export default function PerfilCliente({ cliente }: Props) {
    const router = useRouter();
    const [email, setEmail] = useState(cliente?.email || "");
    const [phone, setPhone] = useState(cliente?.telefono || "");
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
    const [direccionAEditar, setDireccionAEditar] = useState<any | null>(null);
    
    // Formulario dirección
    const [nuevaCalle, setNuevaCalle] = useState("");
    const [nuevoCP, setNuevoCP] = useState("");
    const [esPredeterminada, setEsPredeterminada] = useState(false);
    const [creandoDireccion, setCreandoDireccion] = useState(false);

    // Valores fijos requeridos
    const CIUDAD_DEFAULT = "Mexicali";
    const ESTADO_DEFAULT = "Baja California";

    const { data: direcciones, mutate } = useSWR("direcciones", obtenerMisDirecciones);

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

    const handleCrearOEditarDireccion = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreandoDireccion(true);
        
        const payload = {
            calle: nuevaCalle,
            ciudad: CIUDAD_DEFAULT,
            estado: ESTADO_DEFAULT,
            codigo_postal: nuevoCP,
            es_predeterminada: esPredeterminada
        };

        let exito = false;
        if (direccionAEditar) {
            exito = await actualizarDireccion(direccionAEditar.id, payload);
        } else {
            exito = await crearDireccion(payload);
        }

        if (exito) {
            mutate();
            setMostrarFormDireccion(false);
            setDireccionAEditar(null);
            setNuevaCalle("");
            setNuevoCP("");
            setEsPredeterminada(false);
        }
        setCreandoDireccion(false);
    };

    const handleEliminarDireccion = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta dirección?")) {
            const exito = await eliminarDireccion(id);
            if (exito) mutate();
        }
    };

    const iniciarEdicion = (dir: any) => {
        setDireccionAEditar(dir);
        setNuevaCalle(dir.calle);
        setNuevoCP(dir.codigo_postal);
        setEsPredeterminada(dir.es_predeterminada);
        setMostrarFormDireccion(true);
    };

    const cancelarEdicion = () => {
        setMostrarFormDireccion(false);
        setDireccionAEditar(null);
        setNuevaCalle("");
        setNuevoCP("");
        setEsPredeterminada(false);
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

                </div>
            </section>

            {/* <EstadisticasCliente/> */}
            {/* <EtiquetasClientes/> */}

            {/* Información de contacto */}
            <section className="px-4 mb-6">
                <Tarjeta>
                    <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2 mb-4">
                        <span className="text-yellow-600"><Settings size={20} /></span>
                        Información de contacto
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div>

                        <SubTitulo className=" text-md font-bold text-stone-500 uppercase tracking-wider mb-1">Correo electronico</SubTitulo>
                        <Parrafo className="text-md text-stone-900" >{email}</Parrafo>
                        </div>
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
                    <button 
                        onClick={() => mostrarFormDireccion ? cancelarEdicion() : setMostrarFormDireccion(true)}
                        className="text-sm text-yellow-600 font-medium"
                    >
                        {mostrarFormDireccion ? "Cancelar" : "+ Agregar nueva"}
                    </button>
                </div>

                {mostrarFormDireccion && (
                    <Tarjeta className="mb-4 border border-yellow-200">
                        <form onSubmit={handleCrearOEditarDireccion} className="flex flex-col gap-3">
                            <h4 className="text-sm font-bold text-stone-900 mb-1">
                                {direccionAEditar ? "Editar dirección" : "Nueva dirección"}
                            </h4>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-stone-500 uppercase">Calle y número</label>
                                <input 
                                    type="text" placeholder="Ej. Av. Reforma 123" value={nuevaCalle} onChange={e => setNuevaCalle(e.target.value)} required
                                    className="text-xs p-2.5 border border-stone-200 rounded-lg outline-none focus:border-yellow-400 bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Ciudad</label>
                                    <input 
                                        type="text" value={CIUDAD_DEFAULT} disabled
                                        className="text-xs p-2.5 border border-stone-100 rounded-lg bg-stone-50 text-stone-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Estado</label>
                                    <input 
                                        type="text" value={ESTADO_DEFAULT} disabled
                                        className="text-xs p-2.5 border border-stone-100 rounded-lg bg-stone-50 text-stone-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-stone-500 uppercase">Código Postal</label>
                                <input 
                                    type="text" placeholder="21000" value={nuevoCP} onChange={e => setNuevoCP(e.target.value)} required
                                    className="text-xs p-2.5 border border-stone-200 rounded-lg outline-none focus:border-yellow-400 bg-white"
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-1 px-1">
                                <input 
                                    type="checkbox" 
                                    id="es_predeterminada"
                                    checked={esPredeterminada} 
                                    onChange={e => setEsPredeterminada(e.target.checked)}
                                    className="w-4 h-4 rounded border-stone-300 text-yellow-600 focus:ring-yellow-500"
                                />
                                <label htmlFor="es_predeterminada" className="text-xs font-medium text-stone-700 cursor-pointer select-none">
                                    Establecer como dirección predeterminada
                                </label>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <Boton type="submit" disabled={creandoDireccion} className="flex-1">
                                    {creandoDireccion ? "Guardando..." : direccionAEditar ? "Guardar cambios" : "Guardar dirección"}
                                </Boton>
                            </div>
                        </form>
                    </Tarjeta>
                )}

                <div className="flex flex-col gap-3">
                    {direcciones && direcciones.length > 0 ? (
                        direcciones.map((dir: any) => (
                            <div 
                                key={dir.id}
                                className={`group border ${dir.es_predeterminada ? 'border-yellow-400 bg-yellow-50' : 'border-stone-200 bg-white'} p-4 rounded-xl shadow-sm transition-all hover:border-yellow-300 relative`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-stone-900 text-sm">Dirección</h4>
                                        {dir.es_predeterminada && (
                                            <Badge variante="oro" className="text-[9px] px-2 py-0.5 rounded font-bold uppercase">Predeterminada</Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => iniciarEdicion(dir)}
                                            className="p-1.5 text-stone-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                            title="Editar"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleEliminarDireccion(dir.id)}
                                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-stone-600 leading-relaxed max-w-[85%]">
                                    {dir.calle}<br />
                                    {dir.ciudad}, {dir.estado} {dir.codigo_postal}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 gap-2">
                            <Truck size={32} className="opacity-20" />
                            <p className="text-xs font-medium">No tienes direcciones registradas</p>
                        </div>
                    )}
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
