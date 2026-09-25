/** @jsxImportSource nativewind */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Image, TextInput, View } from "react-native";
import { ArrowLeft, ArrowUpRight, Camera, Loader2, MapPin, Package, Plus, PlusCircle, Settings, ShoppingCart, Star, Store } from "lucide-react-native";
import { MONEDA } from "@akindo/shared/constants";
import {
    obtenerCatalogoDistribuidorPublico,
    obtenerDistribuidor,
    type DistribuidorPublicoResponse,
    type ProductoCatalogoPublico,
} from "@akindo/shared/api/distribuidor";
import { useAgregarAlCarrito } from "@akindo/shared/carrito-context";
import useRouter from "@akindo/ui/router";
import { elegirImagen, archivoDeImagen } from "@akindo/ui/image-picker";
import { H1, H2, H3, Header, P, Pressable, Section, Span } from "@akindo/ui/html";
import { Boton, Link, Parrafo, SubTitulo, Titulo } from "@akindo/ui/components";
import { ContenedorPantalla, Centinela } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Degradado } from "@akindo/ui/components/ui/Degradado";
import { Girando, Pulso, Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import { useScrollInfinito } from "../components/hooks/useScrollInfinito";
import { AllInboxIcon } from "@akindo/ui/icons/NavigationIcons";

export type TiendaProps = {
    /** `null` si la URL no trae `?d=`. */
    distribuidorId: string | null;
    /**
     * Las cuatro necesitan la sesión, así que se inyectan: en web son server
     * actions que leen la cookie; en mobile, llamadas al núcleo con el token
     * de AsyncStorage. Lo público (perfil y catálogo) lo pide la pantalla
     * directo al núcleo compartido.
     */
    esDistribuidorDueno: (distribuidorId: string) => Promise<boolean>;
    actualizarImagenNegocio: (distribuidorId: string, archivo: Blob) => Promise<boolean>;
    actualizarImagenPerfil: (archivo: Blob) => Promise<boolean>;
    actualizarPerfilDistribuidor: (distribuidorId: string, datos: { descripcion?: string }) => Promise<boolean>;
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonProductoList() {
    return (
        <Pulso className="flex flex-row gap-3 bg-white p-3 rounded-2xl border border-stone-100 drop-shadow-sm">
            <View className="w-24 h-24 bg-stone-200 rounded-xl flex-shrink-0" />
            <View className="flex flex-col flex-1 py-1 gap-2">
                <View className="h-4 w-3/4 bg-stone-200 rounded" />
                <View className="h-3 w-1/2 bg-stone-200 rounded" />
                <View className="mt-auto h-4 w-1/3 bg-stone-200 rounded" />
            </View>
        </Pulso>
    );
}

// ── Catálogo con scroll infinito (Vista de Lista) ────────────────────────────

function CatalogoDistribuidor({ distribuidorId }: { distribuidorId: string }) {
    const agregarAlCarrito = useAgregarAlCarrito();
    // El aviso lo pinta el layout: una tarjeta dentro de la lista no puede
    // pintar el suyo (en nativo quedaría encerrado en la celda).
    const avisar = useAviso();
    const [agregandoProducto, setAgregandoProducto] = useState<string | null>(null);
    const [agregados, setAgregados] = useState<Record<string, boolean>>({});

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

    const { items, cargando, cargandoMas, cargarSiguiente, tieneSiguiente } = useScrollInfinito<ProductoCatalogoPublico>({
        fetchFn,
        resetKey: distribuidorId,
    });

    if (cargando) {
        return (
            <View className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonProductoList key={i} />
                ))}
            </View>
        );
    }

    if (items.length === 0) {
        return (
            <View className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-stone-200">
                <View className="mb-2"><Package size={32} color="#D6D3D1" /></View>
                <P className="text-stone-400 text-sm text-center">Sin productos publicados</P>
            </View>
        );
    }

    return (
        <>
            <View className="flex flex-row gap-3 flex-wrap">
                {items.map((p, index) => (
                    <Link
                        href={`/mercado/productos/detalle?p=${p.producto_id}`}
                        key={`${p.producto_id}-${index}`}
                        bloque
                        // `native:w-full`: en web la tarjeta se mide por su contenido y la
                        // columna de texto (`flex-1`) toma lo que sobra. En RN un `flex-1`
                        // dentro de una fila de ancho automático resuelve a 0 y el texto
                        // desaparecía: ahí la tarjeta ocupa el renglón.
                        className="flex flex-row gap-3 bg-white p-3 rounded-2xl border border-stone-200 drop-shadow-sm transition-shadow hover:shadow-md cursor-pointer native:w-full"
                    >
                        {/* Imagen */}
                        <View className="w-24 h-24 flex-shrink-0 bg-stone-100 rounded-xl overflow-hidden relative">
                            {p.imagen ? (
                                // `grayscale` es un filtro de CSS: en nativo solo baja la opacidad.
                                <Image
                                    source={{ uri: p.imagen }}
                                    accessibilityLabel={p.nombre}
                                    resizeMode="cover"
                                    className={`w-full h-full ${!p.disponible ? 'opacity-50 grayscale' : ''}`}
                                />
                            ) : (
                                <View className="w-full h-full flex items-center justify-center">
                                    <Package size={24} color="#D6D3D1" />
                                </View>
                            )}
                        </View>
                        {/* Info */}
                        <View className="flex flex-col flex-1 py-1 min-w-0">
                            <View className="flex flex-row items-start justify-between gap-2">
                                <H3 peso="bold" numberOfLines={2} className="text-lg text-stone-900 leading-snug shrink">
                                    {p.nombre}
                                </H3>
                            </View>
                            <View className="mt-auto flex flex-row items-center justify-between">
                                <Span peso="semibold" className="text-sm text-stone-900">
                                    ${p.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {MONEDA}
                                    <Span className="text-[10px] leading-normal text-stone-500">/{p.unidad}</Span>
                                </Span>
                                {p.disponible && (
                                    <Pressable
                                        role="button"
                                        className="bg-[#EAE1D1] p-1.5 rounded-full transition-colors hover:bg-[#DED2BF] cursor-pointer"
                                        style={agregandoProducto === p.producto_id ? { opacity: 0.6 } : undefined}
                                        // `preventDefault`: en web el evento es el click del DOM y así
                                        // el <a> no navega; en nativo el Pressable se queda el toque.
                                        onPress={async (e) => {
                                            e.preventDefault();
                                            if (agregandoProducto) return;
                                            setAgregandoProducto(p.producto_id);
                                            const result = await agregarAlCarrito({
                                                distribuidorId,
                                                productoId: p.producto_id,
                                                cantidad: 1,
                                            });
                                            avisar(result.ok ? (result.message ?? "Producto agregado") : (result.error ?? "No se pudo agregar"));
                                            if (result.ok) {
                                                setAgregados((prev) => ({ ...prev, [p.producto_id]: true }));
                                            }
                                            setAgregandoProducto(null);
                                        }}
                                        disabled={agregandoProducto === p.producto_id}
                                        accessibilityLabel={`Agregar ${p.nombre} al carrito`}
                                    >
                                        {agregandoProducto === p.producto_id ? (
                                            <Girando><Loader2 size={14} color="#44403C" /></Girando>
                                        ) : agregados[p.producto_id] ? (
                                            <ArrowUpRight size={14} color="#15803D" />
                                        ) : (
                                            <ShoppingCart size={14} color="#44403C" />
                                        )}
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </Link>
                ))}
            </View>
            {/* Centinela */}
            {tieneSiguiente && (
                <Centinela onVisible={cargarSiguiente} className="flex flex-row justify-center py-6">
                    {cargandoMas && <Spinner />}
                </Centinela>
            )}
        </>
    );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function Tienda({
    distribuidorId,
    esDistribuidorDueno,
    actualizarImagenNegocio,
    actualizarImagenPerfil,
    actualizarPerfilDistribuidor,
}: TiendaProps) {
    const router = useRouter();
    const avisar = useAviso();

    const [distribuidor, setDistribuidor] = useState<DistribuidorPublicoResponse | null>(null);
    const [cargandoPerfil, setCargandoPerfil] = useState(true);
    const [noEncontrado, setNoEncontrado] = useState(false);
    const [esDueno, setEsDueno] = useState(false);
    const [editandoDesc, setEditandoDesc] = useState(false);
    const [nuevaDesc, setNuevaDesc] = useState("");

    // El original recargaba la página entera (`window.location.reload()`) para
    // ver la imagen o la descripción nuevas. Acá se vuelve a pedir el perfil:
    // `location` no existe en nativo.
    const cargarPerfil = useCallback(async () => {
        if (!distribuidorId) return;
        const data = await obtenerDistribuidor(distribuidorId);
        if (!data) setNoEncontrado(true);
        else {
            setDistribuidor(data);
            setNuevaDesc(data.descripcion || "");
        }
    }, [distribuidorId]);

    useEffect(() => {
        if (!distribuidorId) {
            setNoEncontrado(true);
            setCargandoPerfil(false);
            return;
        }
        cargarPerfil().finally(() => setCargandoPerfil(false));

        // Verificamos si es dueño sin forzar redirect
        esDistribuidorDueno(distribuidorId).then(setEsDueno);
    }, [distribuidorId]);

    const handleSubirFondo = async () => {
        const uri = await elegirImagen();
        if (!uri || !distribuidorId) return;
        const ok = await actualizarImagenNegocio(distribuidorId, await archivoDeImagen(uri));
        if (ok) cargarPerfil();
        else avisar("No se pudo actualizar la imagen del negocio");
    };

    const handleSubirPerfil = async () => {
        const uri = await elegirImagen();
        if (!uri) return;
        const ok = await actualizarImagenPerfil(await archivoDeImagen(uri));
        if (ok) cargarPerfil();
        else avisar("No se pudo actualizar la imagen de perfil");
    };

    if (cargandoPerfil) {
        return (
            <View className="flex items-center justify-center min-h-screen bg-[#FAF5EE]">
                <Spinner tamano={32} />
            </View>
        );
    }

    if (noEncontrado || !distribuidor) {
        return (
            <View className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 bg-[#FAF5EE]">
                <Store size={48} color="#D6D3D1" />
                <P peso="medium" className="text-stone-500 text-sm text-center">Distribuidor no encontrado</P>
                <Pressable role="button" onPress={() => router.back()} className="mt-4">
                    <Span peso="medium" className="text-sm text-[#C1901D]">Volver atrás</Span>
                </Pressable>
            </View>
        );
    }

    const direccionPrincipal = distribuidor.direcciones.find((d) => d.es_predeterminada) ?? distribuidor.direcciones[0];

    return (
        // indiceFijo 0: el header de la tienda.
        <ContenedorPantalla key="tienda" indiceFijo={0} className="flex flex-col w-full justify-self-center min-h-screen bg-[#FAF5EE] pb-20">
            {/* Header Sticky */}
            <Header className="web:sticky top-0 z-30 bg-[#FAF5EE] flex flex-row items-center px-4 h-14 border-b border-[#E8DEC1]/40">
                <Pressable role="button" accessibilityLabel="Volver" onPress={() => router.back()} className="p-2 -ml-2 transition-colors">
                    <ArrowLeft size={20} color="#44403C" />
                </Pressable>
                <H1 peso="bold" numberOfLines={1} className="text-base text-stone-900 flex-1 text-center -translate-x-3">
                    {distribuidor.nombre_negocio}
                </H1>
            </Header>

            {/* Hero Image */}
            <View className="relative w-full h-48 md:h-64 bg-stone-800">
                {distribuidor.imagen_fondo ? (
                    <Image
                        source={{ uri: distribuidor.imagen_fondo }}
                        accessibilityLabel={distribuidor.nombre_negocio}
                        resizeMode="cover"
                        className="w-full h-full opacity-70"
                    />
                ) : (
                    <View className="w-full h-full flex items-center justify-center opacity-30">
                        <Store size={64} color="#FFFFFF" />
                    </View>
                )}
                {/* bg-gradient-to-t from-black/80 via-black/20 to-transparent */}
                <Degradado
                    direccion="to-t"
                    paradas={[
                        { offset: 0, color: "#000000", opacity: 0.8 },
                        { offset: 0.5, color: "#000000", opacity: 0.2 },
                        { offset: 1, color: "#000000", opacity: 0 },
                    ]}
                />

                {esDueno && (
                    <Pressable
                        role="button"
                        onPress={handleSubirFondo}
                        className="flex flex-row items-center gap-2 px-6 absolute top-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full cursor-pointer transition-all z-10 drop-shadow-sm border border-white/20"
                    >
                        <Camera size={18} color="#FFFFFF" />
                        {/* En el original el span heredaba los 16px/24 del body. */}
                        <Span className="text-white text-base leading-normal">editar fondo</Span>
                    </Pressable>
                )}

                {/* Hero Content */}
                <View className="absolute bottom-4 left-4 right-4 flex flex-row items-end justify-between">
                    <View className="shrink">
                        {/* tracking-wider a 9px = 0.45px. */}
                        <View className={`self-start rounded-sm mb-1.5 px-2 py-0.5 ${distribuidor.es_verificado ? "bg-[#3a992b]" : "bg-[#992B2B]"}`}>
                            <Span peso="bold" className="text-white text-[9px] leading-normal uppercase tracking-[0.45px]">
                                {distribuidor.es_verificado ? "Verificado" : "NO Verificado"}
                            </Span>
                        </View>
                        <H2 peso="semibold" className="text-lg text-white leading-tight">
                            {distribuidor.nombre_negocio}
                        </H2>
                        {direccionPrincipal && (
                            <View className="flex flex-row items-center gap-1 mt-1">
                                <MapPin size={12} color="#FFFFFFCC" />
                                <Span className="text-white/80 text-xs shrink">{direccionPrincipal.ciudad}, {direccionPrincipal.estado}</Span>
                            </View>
                        )}
                    </View>
                    {/* Foto de perfil flotante */}
                    <View className="w-16 h-16 rounded-full border-4 border-[#FAF5EE] bg-white shadow-md flex-shrink-0 relative translate-y-2">
                        <View className="w-full h-full rounded-full overflow-hidden">
                            {distribuidor.imagen_perfil ? (
                                <Image source={{ uri: distribuidor.imagen_perfil }} accessibilityLabel="Logo" resizeMode="cover" className="w-full h-full" />
                            ) : (
                                <View className="w-full h-full bg-stone-100 flex items-center justify-center">
                                    <Store size={20} color="#A8A29E" />
                                </View>
                            )}
                        </View>
                        {esDueno && (
                            <Pressable
                                role="button"
                                accessibilityLabel="Cambiar imagen de perfil"
                                onPress={handleSubirPerfil}
                                className="absolute -bottom-1 -right-1 bg-[#DAA520] hover:bg-[#B8860B] p-1.5 rounded-full cursor-pointer shadow-md border-2 border-[#FAF5EE] transition-colors z-20"
                            >
                                <Camera size={12} color="#FFFFFF" />
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>

            <View className="px-4 mt-6">
                {/* Botón de Acción Principal */}
                {esDueno ? (
                    <Link href="/distribuidor" bloque className="w-full max-w-sm mx-auto flex flex-row items-center justify-center gap-2 bg-[#2C3E50] border border-transparent rounded-xl py-2.5 shadow-md hover:bg-[#1A252F] transition-all active:scale-[0.98]">
                        <Settings size={16} color="#FFFFFF" />
                        <Span peso="semibold" className="text-sm text-white">Administrar mi negocio</Span>
                    </Link>
                ) : (
                    <Pressable role="button" className="w-full max-w-sm mx-auto flex flex-row items-center justify-center gap-2 bg-white border border-[#E8DEC1] rounded-lg py-2 drop-shadow-sm hover:bg-[#FDFBF7] transition-colors cursor-pointer">
                        <Plus size={16} color="#44403C" />
                        <Span peso="semibold" className="text-sm text-stone-700">Seguir Distribuidor</Span>
                    </Pressable>
                )}
                {/* anuncios */}
                <Section className="flex flex-row flex-wrap gap-6">
                    {esDueno && (!distribuidor.es_verificado) && (
                        <Section className="w-full max-w-xl p-4 flex flex-col gap-2 bg-[#F8EED9] rounded-2xl mt-4">
                            <Titulo className="text-red-600">
                                Tu negocio no está verificado !
                            </Titulo>
                            {/* <hr /> con el preflight de Tailwind. */}
                            <View className="border-t border-[#e5e7eb]" />
                            <Parrafo className="text-lg">
                                La verificación ayuda a generar confianza con tus potenciales clientes.
                                <Span peso="bold" className="text-lg">Ayúdanos llenando un formulario</Span> para poderte verificar y empezar tu camino al éxito.
                            </Parrafo>
                            {/* `w-full`: el `w-fit` de la base del Boton le gana al `w-full` de la
                                variante, y en el original el botón ocupaba todo el ancho.
                                `claseTexto`: el `capitalize` de la instancia le ganaba al
                                `uppercase` de la variante (regla 25). */}
                            <Boton variante="primario" className="w-full" claseTexto="capitalize" href="https://www.youtube.com/watch?v=a40r8AhnPm8&t=2s">
                                aquí el formulario
                            </Boton>
                        </Section>
                    )}
                </Section>

                {/* Stats Grid (Mock data combinada con datos reales) */}
                <View className="flex flex-row flex-wrap gap-3 mt-5">
                    <View className="bg-[#F8EED9] rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-[#E8DEC1]/50">
                        <Star size={18} color="#DAA520" fill="#DAA520" />
                        <View>
                            <P peso="semibold" className="text-xs text-stone-800 text-center">{distribuidor.valoracion_promedio.toFixed(1)}</P>
                            {/* tracking-wider a 9px = 0.45px. */}
                            <P className="text-[9px] leading-normal uppercase tracking-[0.45px] text-[#8B7355] mt-0.5 text-center">Valoración ({distribuidor.total_valoraciones})</P>
                        </View>
                    </View>
                </View>

                {/* Acerca de */}
                {(distribuidor.descripcion || esDueno) && (
                    <View className="bg-white rounded-2xl border border-stone-200 p-4 mt-5 drop-shadow-sm">
                        <View className="flex flex-row items-center justify-between mb-2">
                            <SubTitulo className="shrink">
                                <Span peso="semibold" className="text-sm text-[#201B12]">Acerca de </Span>
                                {/* El <b> del original hereda `bolder` sobre 600: 900, que en Jakarta cae a 800. */}
                                <Span peso="extrabold" className="text-sm text-[#DAA520]">{distribuidor.nombre_negocio}</Span>
                            </SubTitulo>
                            {esDueno && (
                                <Pressable
                                    role="button"
                                    onPress={async () => {
                                        if (editandoDesc) {
                                            if (distribuidorId) {
                                                const ok = await actualizarPerfilDistribuidor(distribuidorId, { descripcion: nuevaDesc });
                                                if (ok) {
                                                    setEditandoDesc(false);
                                                    cargarPerfil();
                                                } else avisar("No se pudo guardar la descripción");
                                            }
                                        } else {
                                            setEditandoDesc(true);
                                        }
                                    }}
                                    className="bg-[#F8EED9] px-2 py-1 rounded hover:bg-[#E8DEC1]"
                                >
                                    <Span peso="semibold" className="text-[11px] leading-normal text-[#8B7355]">
                                        {editandoDesc ? "Guardar" : "Editar"}
                                    </Span>
                                </Pressable>
                            )}
                        </View>
                        {editandoDesc ? (
                            <TextInput
                                multiline
                                className="w-full text-xs p-2 border border-stone-200 rounded-lg min-h-[80px] text-stone-600 mb-4"
                                value={nuevaDesc}
                                onChangeText={setNuevaDesc}
                                placeholder="Describe tu negocio, tu especialidad, experiencia..."
                                placeholderTextColor="#A8A29E"
                            />
                        ) : (
                            <P className="text-xs text-stone-600 leading-relaxed mb-4">
                                {distribuidor.descripcion || `Especializada en productos de alta calidad, ${distribuidor.nombre_negocio} ofrece un amplio catálogo para abastecer negocios y distribuidores de todo el mundo.`}
                            </P>
                        )}

                        <View className="flex flex-col gap-3 pt-4 border-t border-stone-100">
                            <View className="flex flex-row items-center justify-between">
                                <Span className="text-xs text-stone-600">Logística primaria</Span>
                                <View className="bg-[#F8EED9] px-2 py-0.5 rounded">
                                    <Span peso="medium" className="text-xs text-[#8B7355]">Transporte aéreo</Span>
                                </View>
                            </View>
                            <View className="flex flex-row items-center justify-between">
                                <Span className="text-xs text-stone-600">Incoterms</Span>
                                <View className="bg-[#F8EED9] px-2 py-0.5 rounded">
                                    <Span peso="medium" className="text-xs text-[#8B7355]">FOB, CIF</Span>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Catálogo Destacado */}
                <View className="mt-6 mb-4 flex flex-row items-center justify-between flex-wrap gap-4">
                    <Titulo>
                        Productos
                    </Titulo>
                    <View className="flex flex-row flex-wrap gap-2">
                        <Boton className="px-6" Icono={PlusCircle} href="/distribuidor/productos/crear" />
                        {esDueno && (
                            <Boton variante="secundario" className="px-6" Icono={AllInboxIcon} href="/distribuidor/productos">
                                gestionar inventario
                            </Boton>
                        )}
                    </View>
                </View>

                {distribuidorId && <CatalogoDistribuidor distribuidorId={distribuidorId} />}
            </View>
        </ContenedorPantalla>
    );
}
