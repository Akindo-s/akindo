"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, Star, Store, Package, ArrowLeft, Plus, Hourglass, Plane, BadgeCheck, ShoppingCart, ChevronRight } from "lucide-react";
import {
    obtenerDistribuidor,
    obtenerCatalogoDistribuidorPublico,
    type DistribuidorPublicoResponse,
    type ProductoCatalogoPublico,
} from "@/lib/api/distribuidor";
import { useScrollInfinito } from "@/components/hooks/useScrollInfinito";

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonProductoList() {
    return (
        <div className="flex gap-3 bg-white p-3 rounded-2xl border border-stone-100 shadow-sm animate-pulse">
            <div className="w-24 h-24 bg-stone-200 rounded-xl flex-shrink-0" />
            <div className="flex flex-col flex-1 py-1 gap-2">
                <div className="h-4 w-3/4 bg-stone-200 rounded" />
                <div className="h-3 w-1/2 bg-stone-200 rounded" />
                <div className="mt-auto h-4 w-1/3 bg-stone-200 rounded" />
            </div>
        </div>
    );
}

// ── Catálogo con scroll infinito (Vista de Lista) ────────────────────────────

function CatalogoDistribuidor({ distribuidorId }: { distribuidorId: string }) {
    const fetchFn = useCallback(
        async (pagina: number) => {
            const data = await obtenerCatalogoDistribuidorPublico(distribuidorId, pagina, 12);
            return {
                items: data.productos,
                tieneSiguiente: data.tiene_siguiente,
            };
        },
        [distribuidorId]
    );

    const { items, cargando, cargandoMas, centinelaRef } = useScrollInfinito<ProductoCatalogoPublico>({
        fetchFn,
        resetKey: distribuidorId,
    });

    if (cargando) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonProductoList key={i} />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-2xl border border-stone-200">
                <Package size={32} className="text-stone-300 mb-2" />
                <p className="text-stone-400 text-sm">Sin productos publicados</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-3">
                {items.map((p, index) => (
                    <div key={p.producto_id} className="flex gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm transition-shadow hover:shadow-md">
                        {/* Imagen */}
                        <div className="w-24 h-24 flex-shrink-0 bg-stone-100 rounded-xl overflow-hidden relative">
                            {p.imagen ? (
                                <img src={p.imagen} alt={p.nombre} className={`w-full h-full object-cover ${!p.disponible ? 'opacity-50 grayscale' : ''}`} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package size={24} className="text-stone-300" />
                                </div>
                            )}
                        </div>
                        {/* Info */}
                        <div className="flex flex-col flex-1 py-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-[13px] font-bold text-stone-900 leading-snug line-clamp-2">
                                    {p.nombre}
                                </h3>
                                {/* Etiqueta de mock de éxito de ventas para el primer item */}
                                {index === 0 && p.disponible && (
                                    <span className="text-[9px] bg-[#FFD6D6] text-[#D32F2F] px-1.5 py-0.5 rounded-sm font-bold flex-shrink-0 uppercase whitespace-nowrap">
                                        Éxito de ventas
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                                {p.disponible ? p.unidad : 'No disponible en este momento'}
                            </p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-sm font-semibold text-stone-900">
                                    ${p.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                    <span className="text-[10px] text-stone-500 font-normal">/{p.unidad}</span>
                                </span>
                                {p.disponible && (
                                    <button className="bg-[#EAE1D1] p-1.5 rounded-full text-stone-700 hover:bg-[#DED2BF] transition-colors cursor-pointer">
                                        <ShoppingCart size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Centinela */}
            <div ref={centinelaRef} className="flex justify-center py-6">
                {cargandoMas && (
                    <div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                )}
            </div>
        </>
    );
}

// ── Página principal ─────────────────────────────────────────────────────────

function TiendaContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const distribuidorId = searchParams.get("d");

    const [distribuidor, setDistribuidor] = useState<DistribuidorPublicoResponse | null>(null);
    const [cargandoPerfil, setCargandoPerfil] = useState(true);
    const [noEncontrado, setNoEncontrado] = useState(false);

    useEffect(() => {
        if (!distribuidorId) {
            setNoEncontrado(true);
            setCargandoPerfil(false);
            return;
        }
        obtenerDistribuidor(distribuidorId).then((data) => {
            if (!data) setNoEncontrado(true);
            else setDistribuidor(data);
            setCargandoPerfil(false);
        });
    }, [distribuidorId]);

    if (cargandoPerfil) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FAF5EE]">
                <div className="w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (noEncontrado || !distribuidor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-6 bg-[#FAF5EE]">
                <Store size={48} className="text-stone-300" />
                <p className="text-stone-500 text-sm font-medium">Distribuidor no encontrado</p>
                <button onClick={() => router.back()} className="mt-4 text-sm font-medium text-[var(--color-primary-600)]">
                    Volver atrás
                </button>
            </div>
        );
    }

    const direccionPrincipal = distribuidor.direcciones.find((d) => d.es_predeterminada) ?? distribuidor.direcciones[0];

    return (
        <div className="flex flex-col min-h-screen bg-[#FAF5EE] pb-20">
            {/* Header Sticky */}
            <header className="sticky top-0 z-30 bg-[#FAF5EE] flex items-center px-4 h-14 border-b border-[#E8DEC1]/40">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-stone-700 hover:text-stone-900 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-base font-bold text-stone-900 mx-auto transform -translate-x-3">
                    {distribuidor.nombre_negocio}
                </h1>
            </header>

            {/* Hero Image */}
            <div className="relative w-full h-48 md:h-64 bg-stone-800">
                {distribuidor.imagen_fondo ? (
                    <img
                        src={distribuidor.imagen_fondo}
                        alt={distribuidor.nombre_negocio}
                        className="w-full h-full object-cover opacity-70"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                        <Store size={64} className="text-white" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Hero Content */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                        <span className="inline-block bg-[#992B2B] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase mb-1.5">
                            Verificado
                        </span>
                        <h2 className="text-lg font-semibold text-white leading-tight">
                            {distribuidor.nombre_negocio}
                        </h2>
                        {direccionPrincipal && (
                            <div className="flex items-center gap-1 mt-1 text-white/80 text-xs">
                                <MapPin size={12} />
                                <span>{direccionPrincipal.ciudad}, {direccionPrincipal.estado}</span>
                            </div>
                        )}
                    </div>
                    {/* Foto de perfil flotante */}
                    <div className="w-16 h-16 rounded-full border-4 border-[#FAF5EE] overflow-hidden bg-white shadow-md flex-shrink-0 relative transform translate-y-2">
                        {distribuidor.imagen_perfil ? (
                            <img src={distribuidor.imagen_perfil} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                                <Store size={20} className="text-stone-400" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 mt-6">
                {/* Botón Follow */}
                <button className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-white border border-[#E8DEC1] rounded-lg py-2 text-sm font-semibold text-stone-700 shadow-sm hover:bg-[#FDFBF7] transition-colors cursor-pointer">
                    <Plus size={16} /> Follow
                </button>

                {/* Stats Grid (Mock data combinada con datos reales) */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-[#F8EED9] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-[#E8DEC1]/50">
                        <Hourglass size={18} className="text-[#8B7355]" />
                        <div>
                            <p className="text-xs font-semibold text-stone-800">50kg</p>
                            <p className="text-[9px] uppercase tracking-wider text-[#8B7355] mt-0.5">Orden Mín.</p>
                        </div>
                    </div>
                    <div className="bg-[#F8EED9] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-[#E8DEC1]/50">
                        <Star size={18} className="text-[#DAA520] fill-[#DAA520]" />
                        <div>
                            <p className="text-xs font-semibold text-stone-800">{distribuidor.valoracion_promedio.toFixed(1)}</p>
                            <p className="text-[9px] uppercase tracking-wider text-[#8B7355] mt-0.5">Valoración ({distribuidor.total_valoraciones})</p>
                        </div>
                    </div>
                    <div className="bg-[#F8EED9] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-[#E8DEC1]/50">
                        <Plane size={18} className="text-[#8B7355]" />
                        <div>
                            <p className="text-xs font-semibold text-stone-800">3-5 Días</p>
                            <p className="text-[9px] uppercase tracking-wider text-[#8B7355] mt-0.5">Tiempos</p>
                        </div>
                    </div>
                    <div className="bg-[#F8EED9] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-[#E8DEC1]/50">
                        <BadgeCheck size={18} className="text-[#992B2B]" />
                        <div>
                            <p className="text-xs font-semibold text-stone-800">5 años</p>
                            <p className="text-[9px] uppercase tracking-wider text-[#8B7355] mt-0.5">Experiencia</p>
                        </div>
                    </div>
                </div>

                {/* Acerca de */}
                <div className="bg-white rounded-2xl border border-stone-200 p-4 mt-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-stone-800 mb-2">Acerca de:</h3>
                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        Especializada en productos de alta calidad, {distribuidor.nombre_negocio} ofrece un amplio catálogo para abastecer negocios y distribuidores de todo el mundo.
                    </p>
                    
                    <div className="flex flex-col gap-3 pt-4 border-t border-stone-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-stone-600">Logística primaria</span>
                            <span className="text-xs font-medium bg-[#F8EED9] text-[#8B7355] px-2 py-0.5 rounded">Transporte aéreo</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-stone-600">Incoterms</span>
                            <span className="text-xs font-medium bg-[#F8EED9] text-[#8B7355] px-2 py-0.5 rounded">FOB, CIF</span>
                        </div>
                    </div>
                </div>

                {/* Catálogo Destacado */}
                <div className="mt-6 mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-stone-800">Catálogo destacado</h2>
                    <button className="flex items-center text-[11px] font-semibold text-[#8B7355] hover:underline">
                        Ver todo <ChevronRight size={14} className="ml-0.5" />
                    </button>
                </div>
                
                {distribuidorId && <CatalogoDistribuidor distribuidorId={distribuidorId} />}
            </div>
        </div>
    );
}

export default function TiendaPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen bg-[#FAF5EE]">
                    <div className="w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <TiendaContent />
        </Suspense>
    );
}
