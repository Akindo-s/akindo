/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { View } from "react-native";
import { ChevronRight, Grid3X3, Package } from "lucide-react-native";
import type { CargarCategorias } from "@akindo/shared/categorias-context";
import type { ProductoCatalogoResponse } from "@akindo/shared/api/productos";
import { H1, H2, P, Section, Span } from "@akindo/ui/html";
import { Link } from "@akindo/ui/components";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Degradado } from "@akindo/ui/components/ui/Degradado";
import { MercadoBuscador } from "@akindo/ui/components/mercado/MercadoBuscador";
import { TarjetaProductoCatalogo } from "@akindo/ui/components/mercado/TarjetaProductoCatalogo";
import { StorefrontIcon } from "@akindo/ui/icons/NavigationIcons";

type IconoSeccion = React.ComponentType<{ size?: number; color?: string }>;

// Los colores de Tailwind del original, en hex: `from-*` / `to-*` del
// degradado, `border-*` y el `text-*` / `bg-*` de la caja del ícono.
const SECCIONES: {
    href: string;
    label: string;
    descripcion: string;
    Icon: IconoSeccion;
    desde: string;
    hasta: string;
    borde: string;
    icono: string;
    fondoIcono: string;
}[] = [
    {
        href: "/mercado/categorias",
        label: "Explorar categorías",
        descripcion: "Navega por todas las categorías de productos y distribuidores",
        Icon: Grid3X3,
        desde: "#FFFBEB", hasta: "#FEF3C7", borde: "border-amber-200",
        icono: "#D97706", fondoIcono: "bg-amber-100",
    },
    {
        href: "/mercado/distribuidores",
        label: "Explorar distribuidores",
        descripcion: "Encuentra proveedores verificados para tu negocio",
        Icon: StorefrontIcon,
        desde: "#FAFAF9", hasta: "#F5F5F4", borde: "border-stone-200",
        icono: "#57534E", fondoIcono: "bg-stone-100",
    },
    {
        href: "/mercado/productos",
        label: "Explorar productos",
        descripcion: "Busca entre miles de productos mayoristas",
        Icon: Package,
        desde: "#FFF7ED", hasta: "#FFEDD5", borde: "border-orange-200",
        icono: "#EA580C", fondoIcono: "bg-orange-100",
    },
];

function TarjetaSeccion({ href, label, descripcion, Icon, desde, hasta, borde, icono, fondoIcono }: (typeof SECCIONES)[number]) {
    // `group-hover:translate-x-0.5` de la flecha, con estado.
    const [enHover, setEnHover] = useState(false);
    return (
        <Link
            href={href}
            bloque
            onHoverChange={setEnHover}
            // overflow-hidden: el degradado es una capa aparte y tiene que
            // respetar las esquinas redondeadas.
            className={`flex flex-row items-center gap-3 p-4 rounded-2xl border overflow-hidden ${borde} hover:shadow-md transition-all active:scale-[0.98] md:flex-1`}
        >
            <Degradado direccion="to-br" paradas={[{ offset: 0, color: desde }, { offset: 1, color: hasta }]} />
            <View className={`p-2.5 rounded-xl ${fondoIcono} flex-shrink-0`}>
                <Icon size={20} color={icono} />
            </View>
            <View className="flex-1 min-w-0">
                <P peso="bold" className="text-sm text-stone-900 leading-snug">
                    {label}
                </P>
                <P numberOfLines={2} className="text-xs text-stone-500 leading-snug mt-0.5">
                    {descripcion}
                </P>
            </View>
            <View className={`flex-shrink-0 transition-transform ${enHover ? "translate-x-0.5" : ""}`}>
                <ChevronRight size={16} color="#A8A29E" />
            </View>
        </Link>
    );
}

type MercadoProps = {
    /** Categorías de los chips del buscador. Web: server action. Mobile: llamada con el token guardado. */
    cargarCategorias: CargarCategorias;
    /** Primeros productos del catálogo global. Web los carga en el servidor; mobile en la pantalla. */
    recomendaciones: ProductoCatalogoResponse[];
};

export default function Mercado({ cargarCategorias, recomendaciones }: MercadoProps) {
    return (
        // indiceFijo 1: el buscador, segundo hijo.
        <ContenedorPantalla indiceFijo={1} className="flex flex-col gap-6 px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
            {/* Título */}
            <H1 peso="bold" className="text-lg text-[#2B2722]">
                El{" "}
                <Span peso="bold" className="text-[#DAA520]">Mercado</Span>
            </H1>

            {/* Buscador */}
            <MercadoBuscador cargarCategorias={cargarCategorias} />

            {/* Secciones de exploración */}
            <Section className="flex flex-col gap-3">
                {/* tracking-wide = 0.025em; a 14px son 0.35px. */}
                <H2 peso="semibold" className="text-sm text-stone-500 uppercase tracking-[0.35px]">
                    Explorar
                </H2>
                {/* `flex flex-col md:grid md:grid-cols-3`: en fila con flex-1 queda igual que el grid. */}
                <View className="flex flex-col md:flex-row gap-3">
                    {SECCIONES.map((seccion) => (
                        <TarjetaSeccion key={seccion.href} {...seccion} />
                    ))}
                </View>
            </Section>

            {/* Recomendaciones */}
            {recomendaciones.length > 0 && (
                <Section className="flex flex-col gap-3">
                    <View className="flex flex-row items-center justify-between">
                        {/* shrink: en CSS el título se encoge si no entra junto al link. */}
                        <H2 peso="bold" className="text-sm text-[#2B2722] shrink">
                            Productos que podrían interesarte
                        </H2>
                        <Link
                            href="/mercado/productos"
                            peso="medium"
                            className="text-xs text-[#DAA520] hover:underline transition select-none"
                        >
                            Ver todos →
                        </Link>
                    </View>

                    {/* `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3` (ver FeaturedCategories). */}
                    <View className="flex flex-row flex-wrap -m-1.5">
                        {recomendaciones.map((p) => (
                            <View key={p.producto_id} className="w-1/2 md:w-1/3 lg:w-1/4 p-1.5">
                                <TarjetaProductoCatalogo
                                    productoId={p.producto_id}
                                    nombre={p.nombre}
                                    costo={p.costo}
                                    unidad={p.unidad}
                                    imagen={p.imagen}
                                    disponible={p.disponible}
                                />
                            </View>
                        ))}
                    </View>
                </Section>
            )}
        </ContenedorPantalla>
    );
}
