/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { Image, View } from "react-native";
import { ArrowUpRight, Loader2, Package, ShoppingCart } from "lucide-react-native";
import { MONEDA } from "@akindo/shared/constants";
import { useAgregarAlCarrito, useIdsCarrito } from "@akindo/shared/carrito-context";
import { H3, P, Pressable, Span } from "../html-elements";
import { Link } from "../link";
import { useAviso } from "../ui/Avisos";
import { Girando } from "../ui/Animaciones";

interface TarjetaProductoCatalogoProps {
    productoId: string;
    nombre: string;
    costo: number;
    unidad: string;
    imagen: string | null;
    disponible: boolean;
}

/**
 * Tarjeta de producto simplificada para el catálogo público del mercado.
 * Solo lectura — sin controles de edición ni archivar.
 */
export function TarjetaProductoCatalogo({
    productoId,
    nombre,
    costo,
    unidad,
    imagen,
    disponible,
}: TarjetaProductoCatalogoProps) {
    const [agregando, setAgregando] = useState(false);
    const idsCarrito = useIdsCarrito();
    const agregar = useAgregarAlCarrito();
    // El aviso lo pinta el layout (ver Avisos.tsx): acá quedaría encerrado en la celda.
    const avisar = useAviso();
    const [agregado, setAgregado] = useState(() => idsCarrito.has(productoId));
    const deshabilitado = !disponible || agregando;

    return (
            // flex-1: en el grid original la tarjeta se estiraba al alto de la fila.
            <Link
                href={`/mercado/productos/detalle?p=${productoId}`}
                bloque
                className={`flex-1 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                    !disponible ? "opacity-60" : ""
                }`}
            >
                {/* Imagen */}
                <View className="relative w-full h-36 bg-[#FBF7EF]">
                    {imagen ? (
                        <Image
                            source={{ uri: imagen }}
                            accessibilityLabel={nombre}
                            resizeMode="cover"
                            className="w-full h-full"
                        />
                    ) : (
                        <View className="w-full h-full flex items-center justify-center">
                            <Package size={36} color="#D6D3D1" />
                        </View>
                    )}
                    {!disponible && (
                        <View className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <View className="bg-black/50 px-2 py-0.5 rounded-full">
                                <Span peso="semibold" className="text-[10px] leading-normal text-white">
                                    No disponible
                                </Span>
                            </View>
                        </View>
                    )}
                </View>

                {/* Contenido */}
                <View className="p-3 flex flex-col gap-2">
                    <H3 peso="bold" numberOfLines={2} className="text-sm text-stone-900 leading-snug">
                        {nombre}
                    </H3>
                    <View className="mt-auto flex flex-row items-center justify-between gap-2">
                        {/* shrink: en CSS el <p> se encogía y partía la línea. El ml-0.5 del
                            Span no aplica en nativo (un Text anidado no tiene margen). */}
                        <P peso="bold" className="text-base text-[#DAA520] shrink">
                            ${costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {MONEDA}
                            <Span className="text-xs text-stone-400 ml-0.5">/{unidad}</Span>
                        </P>
                        <Pressable
                            role="button"
                            disabled={deshabilitado}
                            accessibilityLabel={`Agregar ${nombre} al carrito`}
                            className={`rounded-full bg-[#EAE1D1] p-1.5 ${deshabilitado ? "opacity-50" : ""}`}
                            onPress={async (e) => {
                                // En web el botón vive dentro del <a> de la tarjeta: sin
                                // esto el click también navegaba al detalle.
                                e.preventDefault();
                                if (agregado) return;
                                setAgregando(true);
                                const result = await agregar({ productoId, cantidad: 1 });
                                avisar(result.ok ? (result.message ?? "Producto agregado") : (result.error ?? "No se pudo agregar"));
                                if (result.ok) {
                                    setAgregado(true);
                                }
                                setAgregando(false);
                            }}
                        >
                            {/* text-stone-700; text-green-700 cuando ya está en el carrito. */}
                            {agregando ? (
                                <Girando><Loader2 size={14} color="#44403C" /></Girando>
                            ) : agregado ? (
                                <ArrowUpRight size={14} color="#15803D" />
                            ) : (
                                <ShoppingCart size={14} color="#44403C" />
                            )}
                        </Pressable>
                    </View>
                </View>
            </Link>
    );
}
