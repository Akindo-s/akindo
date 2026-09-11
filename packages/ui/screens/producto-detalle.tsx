/** @jsxImportSource nativewind */
"use client";

import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { ArrowLeft, ArrowUpRight, Loader2, Package, Store, MapPin, ShoppingCart, ShieldCheck, AlertCircle } from "lucide-react-native";
import { MONEDA } from "@akindo/shared/constants";
import { obtenerProductoPublico, type ProductoResponse } from "@akindo/shared/api/productos";
import { obtenerDistribuidor, type DistribuidorPublicoResponse } from "@akindo/shared/api/distribuidor";
import { useAgregarAlCarrito } from "@akindo/shared/carrito-context";
import useRouter from "@akindo/ui/router";
import { H1, H2, H3, H4, P, Pressable, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { HeaderSticky } from "@akindo/ui/components/ui/HeaderSticky";
import { Girando, Pulso } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import { CostosVolumen, type NivelPrecio } from "@akindo/ui/components/mercado/CostosVolumen";
import { StorefrontIcon } from "@akindo/ui/icons/NavigationIcons";

/** `Loader2` con `animate-spin`, con la firma de `Icono` del Boton. */
function LoaderGirando(props: { size?: number; color?: string }) {
    return <Girando><Loader2 {...props} /></Girando>;
}

type ProductoDetalleProps = {
    /** `null` si la URL no trae `?p=`. */
    productoId: string | null;
    /**
     * Si el producto ya está en el carrito del cliente. Necesita la sesión:
     * web, server action (cookie); mobile, llamada con el token guardado.
     */
    verificarEnCarrito: (productoId: string) => Promise<boolean>;
};

export default function ProductoDetalle({ productoId, verificarEnCarrito }: ProductoDetalleProps) {
    if (!productoId) {
        // Antes vivía en el page.tsx de web (Server Component).
        return (
            <View className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#FAF5EE]">
                <P peso="medium" className="text-stone-500 text-sm mb-4 text-center">No se especificó un producto.</P>
                <Link href="/mercado/productos" bloque className="bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
                    <Span peso="medium" className="text-sm text-[#C1901D]">Volver al catálogo</Span>
                </Link>
            </View>
        );
    }
    return <Detalle productoId={productoId} verificarEnCarrito={verificarEnCarrito} />;
}

function Detalle({ productoId, verificarEnCarrito }: { productoId: string; verificarEnCarrito: ProductoDetalleProps["verificarEnCarrito"] }) {
    const router = useRouter();
    const agregarAlCarrito = useAgregarAlCarrito();
    // El aviso de error lo pinta el layout (ver Avisos.tsx).
    const avisar = useAviso();
    const [producto, setProducto] = useState<ProductoResponse | null>(null);
    const [distribuidor, setDistribuidor] = useState<DistribuidorPublicoResponse | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unidadMedidaStr, setUnidadMedidaStr] = useState<string>("unidad");
    const [cantidad, setCantidadSeleccionada] = useState<number>(0);
    const [agregando, setAgregando] = useState(false);
    const [agregado, setAgregado] = useState(false);
    const [toastOk, setToastOk] = useState<string | null>(null);

    useEffect(() => {
        // Lecturas públicas: van directo al núcleo compartido en las dos plataformas.
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

    // Verificar si ya está en el carrito (una sola vez al renderizar)
    useEffect(() => {
        const checkCarrito = async () => {
            const yaEsta = await verificarEnCarrito(productoId);
            if (yaEsta) setAgregado(true);
        };
        checkCarrito();
    }, [productoId]);

    useEffect(() => {
        if (!toastOk) return;
        const timer = setTimeout(() => setToastOk(null), 2400);
        return () => clearTimeout(timer);
    }, [toastOk]);

    if (cargando) {
        return (
            // `key`: sin ella React reutiliza el mismo ScrollView al terminar de
            // cargar y el Header nuevo (con `transition` y `hover:`) obliga a
            // nativewind a "mejorarlo" en caliente, lo que en nativo reventaba.
            <ContenedorPantalla key="cargando" indiceFijo={0} className="flex flex-col min-h-screen bg-stone-50 pb-20">
                <View className="web:sticky top-0 z-30 bg-white flex flex-row items-center px-4 h-14 border-b border-stone-100 shadow-sm">
                    <Pressable role="button" accessibilityLabel="Volver" onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={20} color="#78716C" />
                    </Pressable>
                    <View className="w-1/3 ml-4"><Pulso className="h-4 w-full bg-stone-200 rounded" /></View>
                </View>
                <Pulso className="w-full h-72 bg-stone-200" />
                <View className="p-5 flex flex-col gap-4">
                    <View className="w-3/4"><Pulso className="h-6 w-full bg-stone-200 rounded" /></View>
                    <View className="w-1/3"><Pulso className="h-8 w-full bg-stone-200 rounded" /></View>
                    <View className="mt-4"><Pulso className="h-20 w-full bg-stone-200 rounded-xl" /></View>
                </View>
            </ContenedorPantalla>
        );
    }

    if (error || !producto) {
        return (
            <View className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 bg-stone-50">
                <AlertCircle size={48} color="#D6D3D1" />
                <P peso="medium" className="text-stone-500 text-sm text-center">{error || "Producto no encontrado"}</P>
                <Pressable
                    role="button"
                    onPress={() => router.back()}
                    className="mt-4 bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm"
                >
                    <Span peso="medium" className="text-sm text-[#C1901D]">Volver atrás</Span>
                </Pressable>
            </View>
        );
    }

    const isAgotado = producto.existencias <= 0;
    const isNoDisponible = !producto.disponible;

    const handleAgregar = async () => {
        if (agregado) {
            router.push('/carrito/')
            return;
        }
        setAgregando(true);
        const result = await agregarAlCarrito({
            distribuidorId: producto.distribuidor_id,
            productoId,
            cantidad: cantidad,
        });
        if (result.ok) {
            setAgregado(true);
            setToastOk(result.message ?? "Producto agregado al carrito");
        } else {
            avisar(result.error ?? "No se pudo agregar el producto");
        }
        setAgregando(false);
    };

    return (
        <>
            {/* indiceFijo 0: el HeaderSticky. */}
            <ContenedorPantalla key="detalle" indiceFijo={0} className="flex flex-col min-h-screen bg-[#FAF5EE] pb-24">
                <HeaderSticky titulo={producto.nombre} />

                {/* Imagen del Producto */}
                <View className="w-full bg-white relative aspect-square md:aspect-[16/9] lg:aspect-[2/1] overflow-hidden border-b border-stone-100 flex items-center justify-center">
                    {producto.imagen ? (
                        // `grayscale` es un filtro de CSS: en nativo solo baja la opacidad.
                        <Image
                            source={{ uri: producto.imagen }}
                            accessibilityLabel={producto.nombre}
                            resizeMode="cover"
                            className={`w-full h-full transition-opacity duration-300 ${isNoDisponible || isAgotado ? 'opacity-50 grayscale' : 'opacity-100'}`}
                        />
                    ) : (
                        <View className="w-full h-full flex flex-col items-center justify-center bg-stone-100">
                            <View className="mb-2"><Package size={64} color="#D6D3D1" /></View>
                            <Span peso="medium" className="text-sm text-stone-400">Sin imagen</Span>
                        </View>
                    )}

                    {/* Badges Flotantes. tracking-wider = 0.05em; a 10px son 0.5px. */}
                    <View className="absolute top-4 left-4 flex flex-col gap-2">
                        {(isNoDisponible || isAgotado) && (
                            <View className="bg-red-500/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm flex flex-row items-center gap-1">
                                <AlertCircle size={12} color="#FFFFFF" />
                                <Span peso="bold" className="text-white text-[10px] leading-normal uppercase tracking-[0.5px]">
                                    {isNoDisponible ? 'No Disponible' : 'Agotado'}
                                </Span>
                            </View>
                        )}
                        {producto.disponible && producto.existencias > 0 && producto.existencias < 67 && (
                            <View className="bg-orange-500/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm self-start">
                                <Span peso="bold" className="text-white text-[10px] leading-normal uppercase tracking-[0.5px]">
                                    ¡Últimas {producto.existencias}!
                                </Span>
                            </View>
                        )}
                    </View>
                </View>

                {/* Información Principal */}
                <View className="bg-white p-5 md:p-6 shadow-sm border-b border-stone-100 mb-2">
                    <View className="flex flex-row flex-wrap items-start justify-between gap-4 mb-3">
                        <H1 peso="bold" className="text-xl md:text-2xl text-stone-900 leading-tight flex-1">
                            {producto.nombre}
                        </H1>
                    </View>

                    <View className="flex flex-row items-baseline gap-1.5 mb-5">
                        <Span peso="extrabold" className="text-3xl text-[#992B2B]">
                            ${producto.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {MONEDA}
                        </Span>
                        <Span peso="medium" className="text-sm text-stone-500">
                            / {unidadMedidaStr}
                        </Span>
                    </View>

                    <View className="flex flex-row flex-wrap items-center gap-3">
                        {producto.categorias && producto.categorias.length > 0 && producto.categorias.map(cat => (
                            <View className="flex flex-row items-center gap-1.5 bg-[#F8EED9] px-3 py-1.5 rounded-lg" key={`categoria-${cat.id}`}>
                                <Span peso="medium" className="text-sm text-stone-600">{cat.nombre}</Span>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Información del Distribuidor */}
                {distribuidor && (
                    <Pressable
                        className="bg-white p-4 md:p-6 shadow-sm border-y border-stone-100 mb-2 mx-0 lg:mx-4 lg:rounded-2xl lg:border lg:mt-4 transition-colors hover:bg-stone-50 cursor-pointer"
                        onPress={() => router.push(`/mercado/distribuidor/tienda?d=${distribuidor.id}`)}
                    >
                        <View className="flex flex-row items-center gap-2 mb-4">
                            <StorefrontIcon size={16} color="#DAA520" />
                            <H3 peso="bold" className="text-sm text-stone-800 uppercase tracking-[0.35px]">
                                Vendido por
                            </H3>
                        </View>

                        <View className="flex flex-row items-center gap-4">
                            <View className="w-14 h-14 rounded-full border-2 border-stone-100 overflow-hidden bg-white shadow-sm flex-shrink-0 flex items-center justify-center">
                                {distribuidor.imagen_perfil ? (
                                    <Image source={{ uri: distribuidor.imagen_perfil }} accessibilityLabel={distribuidor.nombre_negocio} resizeMode="cover" className="w-full h-full" />
                                ) : (
                                    <Store size={24} color="#D6D3D1" />
                                )}
                            </View>
                            <View className="flex-1 min-w-0">
                                <H4 peso="bold" numberOfLines={1} className="text-base text-stone-900">
                                    {distribuidor.nombre_negocio}
                                </H4>
                                {distribuidor.direcciones && distribuidor.direcciones.length > 0 && (
                                    <View className="flex flex-row items-center gap-1 mt-1">
                                        <MapPin size={12} color="#A8A29E" />
                                        <Span numberOfLines={1} className="text-xs text-stone-500 shrink">
                                            {distribuidor.direcciones[0].ciudad}, {distribuidor.direcciones[0].estado}
                                        </Span>
                                    </View>
                                )}
                            </View>
                            {distribuidor.es_verificado && (
                                <View className="flex items-center justify-center bg-green-50 p-2 rounded-full h-10 w-10 shrink-0">
                                    <ShieldCheck size={20} color="#15803D" />
                                </View>
                            )}
                        </View>
                        {/* Era un SubTitulo con `font-bold`: en el original la clase le
                            ganaba al peso light. Igual que antes, se ve aunque el
                            distribuidor esté verificado. */}
                        <H2 peso="bold" className="text-sm mx-2 my-4 text-red-500">este distribuidor no está verificado, no recomendamos comprar sin cerciorarse antes</H2>
                    </Pressable>
                )}

                {/* Descripción (si existe en atributos extra) */}
                {!!(producto.atributos_extra && producto.atributos_extra.descripcion) && (
                    <View className="bg-white p-5 md:p-6 shadow-sm border-y border-stone-100 mb-2 mx-0 lg:mx-4 lg:rounded-2xl lg:border lg:mb-4">
                        <H3 peso="bold" className="text-sm text-stone-800 mb-3 uppercase tracking-[0.35px]">Descripción</H3>
                        <P className="text-sm text-stone-600 leading-relaxed">
                            {producto.atributos_extra.descripcion as string}
                        </P>
                    </View>
                )}

                {/* Atributos Extra */}
                {!!(producto.atributos_extra && producto.atributos_extra.niveles_precio) && (
                    <CostosVolumen
                        costoBase={producto.costo}
                        unidadMedida={unidadMedidaStr}
                        nivelesPrecio={producto.atributos_extra.niveles_precio as NivelPrecio[]}
                        seleccionCantidad={(cantidad: number) => {
                            if (cantidad) {
                                setCantidadSeleccionada(cantidad)
                            }
                        }}
                    />
                )}
            </ContenedorPantalla>

            {/* Barra de acción fija abajo: fuera del ScrollView para que en nativo
                no se vaya con el scroll (`fixed` no existe ahí: va `absolute`). */}
            <View className="absolute web:fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-40">
                <View className="max-w-6xl mx-auto w-full flex flex-row gap-3">
                    {/* En el original las clases de la instancia (fondo #2C3E50,
                        font-bold) perdían contra la variante primario: se veía el
                        botón dorado de siempre. Solo pesaban flex-1 y py-3.5. */}
                    <Boton
                        className="flex-1 py-3.5 active:scale-[0.98]"
                        disabled={isNoDisponible || isAgotado || agregando}
                        onClick={handleAgregar}
                        Icono={agregando ? LoaderGirando : agregado ? ArrowUpRight : ShoppingCart}
                    >
                        {isNoDisponible
                            ? "No Disponible"
                            : isAgotado
                                ? "Agotado"
                                : agregando
                                    ? "Agregando..."
                                    : agregado
                                        ? "En carrito"
                                        : "Agregar al Carrito"}
                    </Boton>
                </View>
            </View>
            {toastOk ? (
                <View className="absolute web:fixed top-4 left-4 right-4 z-50 rounded-xl border border-amber-700/20 bg-amber-500 px-4 py-3">
                    <Span peso="semibold" className="text-sm text-stone-900">{toastOk}</Span>
                </View>
            ) : null}
        </>
    );
}
