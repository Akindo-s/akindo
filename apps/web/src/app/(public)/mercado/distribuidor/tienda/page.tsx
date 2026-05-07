"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Star, Store, Package, ArrowLeft, Plus, Hourglass, Plane, BadgeCheck, ShoppingCart, ChevronRight, Camera, Settings, PlusCircle, Loader2, ArrowUpRight } from "lucide-react";
import { esDistribuidorDueno, actualizarImagenPerfil, actualizarPerfilDistribuidor } from "@/lib/api/usuario";
import {
    obtenerDistribuidor,
    actualizarImagenNegocio,
    obtenerCatalogoDistribuidorPublico,
    type DistribuidorPublicoResponse,
    type ProductoCatalogoPublico,
} from "@/lib/api/distribuidor";
import { useScrollInfinito } from "@/components/hooks/useScrollInfinito";
import { Parrafo, SubTitulo, Titulo } from "@/components/titles";
import { Boton } from "@/components/ui/Boton";
import { MONEDA } from "@/lib/api/constants";
import { AllInboxIcon } from "@/components/icons/NavigationIcons";
import { agregarProductoCliente } from "@/lib/client/carrito";
import { VentanaEmergente } from "@/components/VentanaEmergente";


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
    const [agregandoProducto, setAgregandoProducto] = useState<string | null>(null);
    const [agregados, setAgregados] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<string | null>(null);
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

    const { items, cargando, cargandoMas, centinelaRef, tieneSiguiente } = useScrollInfinito<ProductoCatalogoPublico>({
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
            <div className="flex flex-row gap-3 flex-wrap">
                {items.map((p, index) => {
                    return (
                        <Link href={`/mercado/productos/detalle?p=${p.producto_id}`} key={`${p.producto_id}-${index}`} className="w-sm flex gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm transition-shadow hover:shadow-md cursor-pointer ">
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
                                    <h3 className="text-lg font-bold text-stone-900 leading-snug line-clamp-2">
                                        {p.nombre}
                                    </h3>

                                </div>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-sm font-semibold text-stone-900">
                                        ${p.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {MONEDA}
                                        <span className="text-[10px] text-stone-500 font-normal">/{p.unidad}</span>
                                    </span>
                                    {p.disponible && (
                                        <button
                                            className="bg-[#EAE1D1] p-1.5 rounded-full text-stone-700 hover:bg-[#DED2BF] transition-colors cursor-pointer disabled:opacity-60"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                if (agregandoProducto) return;
                                                setAgregandoProducto(p.producto_id);
                                                const result = await agregarProductoCliente({
                                                    distribuidorId,
                                                    productoId: p.producto_id,
                                                    cantidad: 1,
                                                });
                                                setToast(result.ok ? (result.message ?? "Producto agregado") : (result.error ?? "No se pudo agregar"));
                                                if (result.ok) {
                                                    setAgregados((prev) => ({ ...prev, [p.producto_id]: true }));
                                                }
                                                setAgregandoProducto(null);
                                            }}
                                            disabled={agregandoProducto === p.producto_id}
                                            aria-label={`Agregar ${p.nombre} al carrito`}
                                        >
                                            {agregandoProducto === p.producto_id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : agregados[p.producto_id] ? (
                                                <ArrowUpRight size={14} className="text-green-700" />
                                            ) : (
                                                <ShoppingCart size={14} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
            {/* Centinela */}
            {tieneSiguiente && (
                <div ref={centinelaRef} className="flex justify-center py-6">
                    {cargandoMas && (
                        <div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            )}
            {toast ? <VentanaEmergente mensaje={toast} onClose={() => setToast(null)} /> : null}
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
    const [esDueno, setEsDueno] = useState(false);
    const [editandoDesc, setEditandoDesc] = useState(false);
    const [nuevaDesc, setNuevaDesc] = useState("");

    useEffect(() => {
        if (!distribuidorId) {
            setNoEncontrado(true);
            setCargandoPerfil(false);
            return;
        }
        obtenerDistribuidor(distribuidorId).then((data) => {
            if (!data) setNoEncontrado(true);
            else {
                setDistribuidor(data);
                setNuevaDesc(data.descripcion || "");
            }
            setCargandoPerfil(false);
        });

        // Verificamos si es dueño sin forzar redirect
        esDistribuidorDueno(distribuidorId).then(setEsDueno);
    }, [distribuidorId]);

    const handleSubirFondo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && distribuidorId) {
            const file = e.target.files[0];
            const ok = await actualizarImagenNegocio(distribuidorId, file);
            if (ok) window.location.reload();
        }
    };

    const handleSubirPerfil = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const ok = await actualizarImagenPerfil(file);
            if (ok) window.location.reload();
        }
    };

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
        <div className="flex flex-col w-full justify-self-center min-h-screen bg-[#FAF5EE] pb-20">
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
            <div className="relative w-full h-48 md:h-64 bg-stone-800 group">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {esDueno && (
                    <label className="flex items-center gap-2 px-6  absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full cursor-pointer backdrop-blur-sm transition-all z-10 shadow-sm border border-white/20">
                        <Camera size={18} />
                        <span>editar fondo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleSubirFondo} />
                    </label>
                )}

                {/* Hero Content */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                        {distribuidor.es_verificado ? (

                            <span className="inline-block bg-[#3a992b] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase mb-1.5">
                                Verificado
                            </span>
                        ) :
                            (
                                <span className="inline-block bg-[#992B2B] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase mb-1.5">
                                    NO Verificado
                                </span>
                            )
                        }
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
                    <div className="w-16 h-16 rounded-full border-4 border-[#FAF5EE] overflow-visible bg-white shadow-md flex-shrink-0 relative transform translate-y-2 group/avatar">
                        <div className="w-full h-full rounded-full overflow-hidden">
                            {distribuidor.imagen_perfil ? (
                                <img src={distribuidor.imagen_perfil} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                                    <Store size={20} className="text-stone-400" />
                                </div>
                            )}
                        </div>
                        {esDueno && (
                            <label className="absolute -bottom-1 -right-1 bg-[#DAA520] hover:bg-[#B8860B] text-white p-1.5 rounded-full cursor-pointer shadow-md border-2 border-[#FAF5EE] transition-colors z-20">
                                <Camera size={12} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleSubirPerfil} />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 mt-6">
                {/* Botón de Acción Principal */}
                {esDueno ? (
                    <Link href="/distribuidor" className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-[#2C3E50] border border-transparent rounded-xl py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#1A252F] transition-all active:scale-[0.98]">
                        <Settings size={16} /> Administrar mi negocio
                    </Link>
                ) : (
                    <button className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-white border border-[#E8DEC1] rounded-lg py-2 text-sm font-semibold text-stone-700 shadow-sm hover:bg-[#FDFBF7] transition-colors cursor-pointer">
                        <Plus size={16} /> Seguir Distribuidor
                    </button>
                )}
                {/* anuncios */}
                <section className="flex flex-wrap gap-6">

                    {
                        esDueno && (!distribuidor.es_verificado) && (

                            <section className="w-full max-w-xl p-4 flex flex-col gap-2 bg-[#F8EED9] rounded-2xl mt-4">
                                <Titulo className="text-red-600">
                                    Tu negocio no está verificado !
                                </Titulo>
                                <hr />
                                <Parrafo className="text-lg font-normal">
                                    La verificación ayuda a generar confianza con tus potenciales clientes.
                                    <b>Ayúdanos llenando un formulario</b> para poderte verificar y empezar tu camino al éxito.
                                </Parrafo>
                                <Boton variante="primario" className="capitalize" href="https://www.youtube.com/watch?v=a40r8AhnPm8&t=2s">
                                    aquí el formulario
                                </Boton>
                            </section>
                        )
                    }
                </section>

                {/* Stats Grid (Mock data combinada con datos reales) */}
                <div className="flex flex-wrap gap-3 mt-5">

                    <div className="bg-[#F8EED9] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 border border-[#E8DEC1]/50">
                        <Star size={18} className="text-[#DAA520] fill-[#DAA520]" />
                        <div>
                            <p className="text-xs font-semibold text-stone-800">{distribuidor.valoracion_promedio.toFixed(1)}</p>
                            <p className="text-[9px] uppercase tracking-wider text-[#8B7355] mt-0.5">Valoración ({distribuidor.total_valoraciones})</p>
                        </div>
                    </div>

                </div>

                {/* Acerca de */}
                {(distribuidor.descripcion || esDueno) && (
                    <div className="bg-white rounded-2xl border border-stone-200 p-4 mt-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">

                            <SubTitulo className="font-semibold">
                                Acerca de <b className="text-[var(--color-primary-500)]">{distribuidor.nombre_negocio}</b>
                            </SubTitulo>
                            {esDueno && (
                                <button
                                    onClick={async () => {
                                        if (editandoDesc) {
                                            if (distribuidorId) {
                                                const ok = await actualizarPerfilDistribuidor(distribuidorId, { descripcion: nuevaDesc });
                                                if (ok) window.location.reload();
                                            }
                                        } else {
                                            setEditandoDesc(true);
                                        }
                                    }}
                                    className="text-[11px] font-semibold text-[#8B7355] bg-[#F8EED9] px-2 py-1 rounded hover:bg-[#E8DEC1]"
                                >
                                    {editandoDesc ? "Guardar" : "Editar"}
                                </button>
                            )}
                        </div>
                        {editandoDesc ? (
                            <textarea
                                className="w-full text-xs p-2 border border-stone-200 rounded-lg min-h-[80px] text-stone-600 mb-4 focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                                value={nuevaDesc}
                                onChange={(e) => setNuevaDesc(e.target.value)}
                                placeholder="Describe tu negocio, tu especialidad, experiencia..."
                            />
                        ) : (
                            <p className="text-xs text-stone-600 leading-relaxed mb-4 whitespace-pre-wrap">
                                {distribuidor.descripcion || `Especializada en productos de alta calidad, ${distribuidor.nombre_negocio} ofrece un amplio catálogo para abastecer negocios y distribuidores de todo el mundo.`}
                            </p>
                        )}

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
                )}

                {/* Catálogo Destacado */}
                <div className="mt-6 mb-4 flex items-center justify-between flex-wrap gap-4 ">
                    <Titulo>
                        Productos
                    </Titulo>
                    <div className="flex flex-wrap gap-2">

                    <Boton className="max-w-fit px-6" Icono={PlusCircle} href="/distribuidor/productos/crear">
                        
                    </Boton>
                    {esDueno&&(

                        <Boton variante="secundario" className="max-w-fit px-6 " Icono={AllInboxIcon} href="/distribuidor/productos">
                        gestionar inventario
                    </Boton>
                    )}
                    </div>

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
