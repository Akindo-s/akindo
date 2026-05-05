"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
    obtenerCategoriasProductos,
    obtenerCategoriasDistribuidores,
    crearCategoriaProducto,
    crearCategoriaDistribuidor,
    eliminarCategoriaProducto,
    eliminarCategoriaDistribuidor,
    type CategoriaResponse
} from "@/lib/api/categorias";
import { Boton } from "@/components/ui/Boton";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { Trash2 } from "lucide-react";

function FallBackCategoria() {
    return (
        <div className="relative group border border-stone-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--color-primary-200)] transition-colors">
            ola
        </div>
    )
}

interface CategoriaCardProps {
    cat: CategoriaResponse;
    eliminando: boolean;
    tipo: "productos" | "distribuidores";
    setCategoriaAEliminar: React.Dispatch<React.SetStateAction<{ id: string; tipo: "productos" | "distribuidores"; nombre: string } | null>>;
}

function CategoriaCard({ cat, eliminando, setCategoriaAEliminar,tipo }: CategoriaCardProps) {
    const [imgCargada, setImgCargada] = useState(false);

    return (
        <div key={cat.id} className="relative group border border-stone-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:border-[var(--color-primary-200)] transition-colors">
            <button
                onClick={() => setCategoriaAEliminar({ id: cat.id, tipo: tipo, nombre: cat.nombre })}
                className="absolute top-2 right-2 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar categoría"
                disabled={eliminando}
            >
                <Trash2 size={16} />
            </button>

            {cat.imagen ? (
                <div className="w-12 h-12 relative">
                    {/* Skeleton visible hasta que cargue */}
                    {!imgCargada && (
                        <div className="absolute inset-0 rounded-full bg-stone-200 animate-pulse" />
                    )}
                    <img
                        src={cat.imagen}
                        alt={cat.nombre}
                        onLoad={() => setImgCargada(true)}
                        className={`w-12 h-12 rounded-full object-cover border border-stone-100 transition-opacity duration-300 ${imgCargada ? "opacity-100" : "opacity-0"
                            }`}
                    />
                </div>
            ) : (
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 font-bold text-lg border border-stone-200">
                    {cat.nombre.charAt(0).toUpperCase()}
                </div>
            )}

            <span className="text-sm font-medium text-stone-800">{cat.nombre}</span>
        </div>
    );
}

export default function CategoriasAdminPage() {
    const router = useRouter();
    const [cargando, setCargando] = useState(false);
    const [categoriasProductos, setCategoriasProductos] = useState<CategoriaResponse[]>([]);
    const [categoriasDistribuidores, setCategoriasDistribuidores] = useState<CategoriaResponse[]>([]);
    const [tipoSeleccionado, setTipoSeleccionado] = useState<"productos" | "distribuidores">("productos");
    const [nombre, setNombre] = useState("");
    const [imagen, setImagen] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mensaje, setMensaje] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState<{ id: string; tipo: "productos" | "distribuidores"; nombre: string } | null>(null);
    const [eliminando, setEliminando] = useState(false);

    const cargarDatos = async () => {
        try {
            const [prod, dist] = await Promise.all([
                obtenerCategoriasProductos(),
                obtenerCategoriasDistribuidores()
            ]);
            setCategoriasProductos(prod);
            setCategoriasDistribuidores(dist);
        } catch (error) {
            console.error("Error cargando categorías", error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return;

        setCargando(true);
        setMensaje(null);

        const formData = new FormData();
        formData.append("nombre", nombre);
        if (imagen) {
            formData.append("imagen", imagen);
        }

        let resultado;
        if (tipoSeleccionado === "productos") {
            resultado = await crearCategoriaProducto(formData);
        } else {
            resultado = await crearCategoriaDistribuidor(formData);
        }

        setCargando(false);

        if (resultado.success) {
            setMensaje({ texto: "Categoría creada con éxito", tipo: "exito" });
            setNombre("");
            setImagen(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            cargarDatos(); // Recargar las listas
        } else {
            setMensaje({ texto: resultado.error || "Hubo un error", tipo: "error" });
        }
    };

    const handleEliminar = async () => {
        if (!categoriaAEliminar) return;
        setEliminando(true);
        setMensaje(null);

        let resultado;
        if (categoriaAEliminar.tipo === "productos") {
            resultado = await eliminarCategoriaProducto(categoriaAEliminar.id);
        } else {
            resultado = await eliminarCategoriaDistribuidor(categoriaAEliminar.id);
        }

        setEliminando(false);
        if (resultado.success) {
            setMensaje({ texto: "Categoría eliminada con éxito", tipo: "exito" });
            cargarDatos();
        } else {
            setMensaje({ texto: resultado.error || "Error al eliminar categoría", tipo: "error" });
        }
        setCategoriaAEliminar(null);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-neutral-900)]">Administración de Categorías</h1>
                <p className="text-sm text-[var(--color-neutral-500)] mt-1">Crea y visualiza las categorías de productos y distribuidores.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORMULARIO */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 lg:col-span-1 h-fit">
                    <h2 className="text-lg font-semibold text-stone-800 mb-4">Nueva Categoría</h2>

                    {mensaje && (
                        <div className={`p-3 rounded-lg mb-4 text-sm ${mensaje.tipo === "exito" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {mensaje.texto}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-stone-700">Tipo de Categoría</label>
                            <select
                                value={tipoSeleccionado}
                                onChange={(e) => setTipoSeleccionado(e.target.value as "productos" | "distribuidores")}
                                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-[var(--color-primary-500)] transition-colors"
                            >
                                <option value="productos">Para Productos</option>
                                <option value="distribuidores">Para Distribuidores</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-stone-700">Nombre</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Electrónica"
                                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:border-[var(--color-primary-500)] transition-colors"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-stone-700">Imagen (Opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={(e) => setImagen(e.target.files?.[0] || null)}
                                className="text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)] hover:file:bg-[var(--color-primary-100)] transition-colors cursor-pointer"
                            />
                        </div>

                        <Boton type="submit" disabled={cargando} className="mt-2">
                            {cargando ? "Guardando..." : "Crear Categoría"}
                        </Boton>
                    </form>
                </div>

                {/* LISTAS */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* PRODUCTOS */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
                            Categorías de Productos
                            <span className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">{categoriasProductos.length}</span>
                        </h2>
                    
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {categoriasProductos.map((cat) => (
                                    <Suspense key={cat.id} fallback={<FallBackCategoria />}>
                                        <CategoriaCard
                                            cat={cat}
                                            eliminando={eliminando}
                                            setCategoriaAEliminar={setCategoriaAEliminar}
                                            tipo="productos"
                                        />
                                    </Suspense>
                                ))}
                            </div>
                    
                    </div>

                    {/* DISTRIBUIDORES */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                        <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
                            Categorías de Distribuidores
                            <span className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">{categoriasDistribuidores.length}</span>
                        </h2>
                    
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {categoriasDistribuidores.map((cat) => (
                                    <Suspense key={cat.id} fallback={<FallBackCategoria />}>
                                        <CategoriaCard
                                            cat={cat}
                                            eliminando={eliminando}
                                            setCategoriaAEliminar={setCategoriaAEliminar}
                                            tipo="distribuidores"
                                        />
                                    </Suspense>
                                ))}
                            </div>
                    
                    </div>
                </div>
            </div>

            <ModalConfirmacion
                isOpen={!!categoriaAEliminar}
                onClose={() => setCategoriaAEliminar(null)}
                onConfirm={handleEliminar}
                titulo="¿Eliminar categoría?"
                mensaje={`Estás a punto de eliminar la categoría "${categoriaAEliminar?.nombre}". Esta acción no se puede deshacer y puede afectar a los productos o distribuidores asociados.`}
                textoConfirmar="Eliminar"
                isConfirming={eliminando}
            />
        </div>
    );
}
