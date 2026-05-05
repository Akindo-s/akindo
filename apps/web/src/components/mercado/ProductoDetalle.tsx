"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Store, MapPin, ShoppingCart, Info, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { obtenerProductoPublico, type ProductoResponse, type UnidadMedida } from "@/lib/api/productos";
import { obtenerDistribuidor, type DistribuidorPublicoResponse } from "@/lib/api/distribuidor";
import { StorefrontIcon } from "../icons/NavigationIcons";
import { SubTitulo } from "../titles";
import { CostosVolumen, type NivelPrecio } from "./CostosVolumen";
import { MONEDA } from "@/lib/api/constants";


export function ProductoDetalle({ productoId }: { productoId: string }) {
    const router = useRouter();
    const [producto, setProducto] = useState<ProductoResponse | null>(null);
    const [distribuidor, setDistribuidor] = useState<DistribuidorPublicoResponse | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unidadMedidaStr, setUnidadMedidaStr] = useState<string>("unidad");
    const [selectedTier, setSelectedTier] = useState<number>(0);

    useEffect(() => {
        const fetchDatos = async () => {
            setCargando(true);
            try {
                const prod = await obtenerProductoPublico(productoId);
                if (!prod) {
                    setError("No se pudo encontrar el producto.");
                    setCargando(false);
                    return;
                }
                setProducto(prod);

                console.log(prod)
                setUnidadMedidaStr(prod.medida.unidad);

                // Obtener distribuidor
                if (prod.distribuidor_id) {
                    const dist = await obtenerDistribuidor(prod.distribuidor_id);
                    if (dist) {
                        setDistribuidor(dist);
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Ocurrió un error al cargar el producto.");
            } finally {
                setCargando(false);
            }
        };

        if (productoId) {
            fetchDatos();
        }
    }, [productoId]);

    useEffect(() => {
        console.log(producto)
    }, [producto])

    if (cargando) {
        return (
            <div className="flex flex-col min-h-screen bg-stone-50 pb-20">
                <header className="sticky top-0 z-30 bg-white flex items-center px-4 h-14 border-b border-stone-100 shadow-sm">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-stone-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-4 w-1/3 bg-stone-200 animate-pulse rounded ml-4"></div>
                </header>
                <div className="w-full h-72 bg-stone-200 animate-pulse"></div>
                <div className="p-5 flex flex-col gap-4">
                    <div className="h-6 w-3/4 bg-stone-200 animate-pulse rounded"></div>
                    <div className="h-8 w-1/3 bg-stone-200 animate-pulse rounded"></div>
                    <div className="h-20 w-full bg-stone-200 animate-pulse rounded-xl mt-4"></div>
                </div>
            </div>
        );
    }

    if (error || !producto) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-6 bg-stone-50">
                <AlertCircle size={48} className="text-stone-300" />
                <p className="text-stone-500 text-sm font-medium">{error || "Producto no encontrado"}</p>
                <button onClick={() => router.back()} className="mt-4 text-sm font-medium text-[var(--color-primary-600)] bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
                    Volver atrás
                </button>
            </div>
        );
    }

    const isAgotado = producto.existencias <= 0;
    const isNoDisponible = !producto.disponible;

    return (
        <div className="flex flex-col min-h-screen bg-[#FAF5EE] pb-24">
            {/* Header Sticky */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md flex items-center px-4 h-14 border-b border-stone-200/50 shadow-sm">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-stone-700 hover:text-stone-900 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-sm font-semibold text-stone-900 mx-auto truncate px-4">
                    {producto.nombre}
                </h1>
            </header>

            {/* Imagen del Producto */}
            <div className="w-full bg-white relative aspect-square md:aspect-[16/9] lg:aspect-[2/1] overflow-hidden border-b border-stone-100 flex items-center justify-center">
                {producto.imagen ? (
                    <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${isNoDisponible || isAgotado ? 'opacity-50 grayscale' : 'opacity-100'}`}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100">
                        <Package size={64} className="text-stone-300 mb-2" />
                        <span className="text-sm text-stone-400 font-medium">Sin imagen</span>
                    </div>
                )}

                {/* Badges Flotantes */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {(isNoDisponible || isAgotado) && (
                        <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <AlertCircle size={12} />
                            {isNoDisponible ? 'No Disponible' : 'Agotado'}
                        </span>
                    )}
                    {producto.disponible && producto.existencias > 0 && producto.existencias < 67 && (
                        <span className="bg-orange-500/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            ¡Últimas {producto.existencias}!
                        </span>
                    )}
                </div>
            </div>

            {/* Información Principal */}
            <div className="bg-white p-5 md:p-6 shadow-sm border-b border-stone-100 mb-2">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <h1 className="text-xl md:text-2xl font-bold text-stone-900 leading-tight flex-1">
                        {producto.nombre}
                    </h1>
                </div>

                <div className="flex items-baseline gap-1.5 mb-5">
                    <span className="text-3xl font-extrabold text-[#992B2B]">
                        ${producto.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {MONEDA}
                    </span>
                    <span className="text-sm font-medium text-stone-500">
                        / {unidadMedidaStr}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                    {producto.categorias && producto.categorias.length > 0 && producto.categorias.map(cat => (
                        <div className="flex items-center gap-1.5 bg-[#F8EED9] text-stone-600 px-3 py-1.5 rounded-lg font-medium" key={`categoria-${cat.id}`}>
                            <span>{cat.nombre}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Información del Distribuidor */}
            {distribuidor && (
                <div className="bg-white p-4 md:p-6 shadow-sm border-y border-stone-100 mb-2 mx-0 lg:mx-4 lg:rounded-2xl lg:border lg:mt-4 transition-colors hover:bg-stone-50 cursor-pointer" onClick={() => router.push(`/mercado/distribuidor/tienda?d=${distribuidor.id}`)}>
                    <h3 className="text-sm font-bold text-stone-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                        <StorefrontIcon size={16} className="text-[#DAA520]" />
                        Vendido por
                    </h3>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border-2 border-stone-100 overflow-hidden bg-white shadow-sm flex-shrink-0 flex items-center justify-center">
                            {distribuidor.imagen_perfil ? (
                                <img src={distribuidor.imagen_perfil} alt={distribuidor.nombre_negocio} className="w-full h-full object-cover" />
                            ) : (
                                <Store size={24} className="text-stone-300" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-stone-900 line-clamp-1">
                                {distribuidor.nombre_negocio}
                            </h4>
                            {distribuidor.direcciones && distribuidor.direcciones.length > 0 && (
                                <p className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                                    <MapPin size={12} className="text-stone-400" />
                                    <span className="truncate">{distribuidor.direcciones[0].ciudad}, {distribuidor.direcciones[0].estado}</span>
                                </p>
                            )}
                        </div>
                        {distribuidor.es_verificado && (

                            <div className="flex items-center justify-center bg-green-50 text-green-700 p-2 rounded-full h-10 w-10 shrink-0">

                                <ShieldCheck size={20} />
                            </div>
                        )}
                    </div>
                    <SubTitulo className="mx-2 my-4 font-bold text-red-500">este distribuidor no esta verificado, no recomendamos comprar sin percinarse antes</SubTitulo>
                </div>
            )}

            {/* Descripción (si existe en atributos extra) */}
            {producto.atributos_extra && producto.atributos_extra.descripcion && (
                <div className="bg-white p-5 md:p-6 shadow-sm border-y border-stone-100 mb-2 mx-0 lg:mx-4 lg:rounded-2xl lg:border lg:mb-4">
                    <h3 className="text-sm font-bold text-stone-800 mb-3 uppercase tracking-wide">Descripción</h3>
                    <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                        {producto.atributos_extra.descripcion as string}
                    </p>
                </div>
            )}

            {/* Atributos Extra */}
            {producto.atributos_extra && producto.atributos_extra.niveles_precio && (
                <CostosVolumen 
                    costoBase={producto.costo}
                    unidadMedida={unidadMedidaStr}
                    nivelesPrecio={producto.atributos_extra.niveles_precio as NivelPrecio[]}
                />
            )}

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-40">
                <div className="max-w-6xl mx-auto flex gap-3">
                    <button
                        className="flex-1 bg-[#2C3E50] hover:bg-[#1A252F] text-white py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={isNoDisponible || isAgotado}
                    >
                        <ShoppingCart size={20} />
                        {isNoDisponible ? "No Disponible" : isAgotado ? "Agotado" : "Agregar al Carrito"}
                    </button>
                </div>
            </div>
        </div>
    );
}
