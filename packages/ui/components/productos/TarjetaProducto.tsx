/** @jsxImportSource nativewind */
"use client";

import type { ReactNode } from "react";
import { Image, View } from "react-native";
import { Package } from "lucide-react-native";
import { MONEDA } from "@akindo/shared/constants";
import { H3, P, Span } from "../html-elements";
import { Badge } from "../ui/Badge";

export interface ProductoInventario {
  producto_id: string;
  nombre: string;
  costo: number;
  disponible: boolean;
  unidad: string;
  existencias?: number;
  imagen?: string | null;
}

interface TarjetaProductoProps {
  /** Datos del producto a mostrar. */
  producto: ProductoInventario;
  /** Clases Tailwind adicionales. */
  className?: string;
  /** Los botones de acción, que van junto al precio. */
  children?: ReactNode;
}

/** El umbral de stock bajo que usa el resto de la app. */
const UMBRAL_STOCK = 67;

/**
 * `TarjetaProducto` — tarjeta de producto del inventario del distribuidor.
 *
 * Muestra imagen, nombre, badge de stock, precio y las acciones que le pasen
 * como `children`.
 */
export function TarjetaProducto({ children, producto, className = "" }: TarjetaProductoProps) {
  const existencias = producto.existencias ?? 0;
  const stockBajo = existencias > 0 && existencias <= UMBRAL_STOCK;
  const sinStock = existencias === 0;

  const badgeVariante = sinStock ? "error" : stockBajo ? "advertencia" : "exito";
  const badgeTexto = sinStock ? "Sin Stock" : stockBajo ? "Bajo Stock" : "En Stock";
  const colorExistencias = sinStock ? "text-red-500" : stockBajo ? "text-orange-500" : "text-stone-500";
  // El puntito del badge es `bg-current`: en RN no hay currentColor (regla 3).
  const colorPunto = sinStock ? "bg-red-800" : stockBajo ? "bg-orange-800" : "bg-green-800";

  return (
    <View className={`bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden ${className}`}>
      <View className="relative w-full h-44 bg-[#F3EBE0]">
        {producto.imagen ? (
          <Image source={{ uri: producto.imagen }} accessibilityLabel={producto.nombre} resizeMode="cover" className="w-full h-full" />
        ) : (
          <View className="w-full h-full flex items-center justify-center">
            <Package size={40} color="#D6D3D1" />
          </View>
        )}
        <View className="absolute top-2.5 right-2.5 gap-2.5 items-end">
          <Badge variante={badgeVariante}>
            <View className={`w-1.5 h-1.5 rounded-full mr-1 ${colorPunto}`} />
            <Span peso="medium" className={`text-xs ${sinStock ? "text-red-800" : stockBajo ? "text-orange-800" : "text-green-800"}`}>
              {badgeTexto}
            </Span>
          </Badge>
          {!producto.disponible && (
            <Badge variante="neutro">
              <View className="w-1.5 h-1.5 rounded-full mr-1 bg-stone-600" />
              <Span peso="medium" className="text-xs text-stone-600">archivado</Span>
            </Badge>
          )}
        </View>
      </View>

      <View className="p-4 flex flex-col gap-1.5">
        <H3 peso="bold" numberOfLines={2} className="text-sm text-stone-900 leading-snug">
          {producto.nombre}
        </H3>

        <P peso="medium" className={`text-xs ${colorExistencias}`}>
          Existencias: {existencias} {producto.unidad}
        </P>

        <View className="flex flex-row items-end justify-between mt-1">
          <P peso="bold" className="text-lg text-[#DAA520] shrink">
            ${producto.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {MONEDA}
            <Span className="text-xs text-stone-400"> /{producto.unidad}</Span>
          </P>

          {children}
        </View>
      </View>
    </View>
  );
}
