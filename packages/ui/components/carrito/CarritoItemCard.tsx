/** @jsxImportSource nativewind */
"use client";

import { Image, View } from "react-native";
import { MONEDA } from "@akindo/shared/constants";
import type { CarritoUiItem } from "@akindo/shared/types/carrito";
import { H3, Pressable, Span } from "../html-elements";
import { Link } from "../link";
import { Parrafo } from "../titles";
import { Girando } from "../ui/Animaciones";
import QuantityStepper from "./QuantityStepper";

interface CarritoItemCardProps {
  item: CarritoUiItem;
  distribuidorNombre: string;
  isUpdating?: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

function formatMoney(value: number): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CarritoItemCard({
  item,
  distribuidorNombre,
  isUpdating = false,
  onIncrease,
  onDecrease,
  onRemove,
}: CarritoItemCardProps) {
  return (
    // Era un <article>: @expo/html-elements no lo trae, y el estilo es el mismo.
    <View className="rounded-3xl border border-[#DDD3C7] bg-[#F2ECE6] p-5 drop-shadow-sm">
      <View className="flex flex-row gap-5">
        <Link href={`/mercado/productos/detalle?p=${item.productoId}`} bloque>
          <View className="relative h-32 w-32 overflow-hidden rounded-2xl bg-stone-100">
            {item.imagen ? (
              <Image
                source={{ uri: item.imagen }}
                accessibilityLabel={item.nombre}
                resizeMode="cover"
                className="h-full w-full"
              />
            ) : (
              <View className="flex h-full w-full items-center justify-center">
                <Span className="text-xs text-stone-500">Sin imagen</Span>
              </View>
            )}
            {isUpdating ? (
              <View className="absolute inset-0 flex flex-row items-start justify-end p-2">
                <Girando>
                  <View
                    className="h-4 w-4 rounded-full border-2 border-stone-300 bg-white/70"
                    style={{ borderTopColor: "#44403C" }}
                  />
                </Girando>
              </View>
            ) : null}
          </View>
        </Link>

        <View className="flex min-w-0 flex-1 flex-col gap-2">
          <View className="flex flex-row items-start justify-between gap-2">
            <H3 peso="semibold" numberOfLines={2} className="text-lg leading-tight text-stone-900 md:text-2xl shrink">
              {item.nombre}
            </H3>
            <Pressable
              role="button"
              onPress={onRemove}
              disabled={isUpdating}
              accessibilityLabel={`Eliminar ${item.nombre}`}
              style={isUpdating ? { opacity: 0.5 } : undefined}
            >
              <Span className="text-3xl leading-none text-stone-500">×</Span>
            </Pressable>
          </View>

          <Parrafo className="text-sm text-stone-600 md:text-base">Distribuidor: {distribuidorNombre}</Parrafo>

          <View className="mt-2 flex flex-row flex-wrap items-end justify-between gap-3">
            <QuantityStepper
              value={item.cantidad}
              min={item.cantidadMinima}
              suffix={item.unidad}
              disabled={isUpdating}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
            />
            {/* `shrink`: en CSS este bloque se encoge solo y el precio queda en
                dos líneas; en RN nada se encoge y se salía de la tarjeta (regla 24). */}
            <View className="shrink">
              {/* `text-right` va en el texto: un Text no hereda la alineación. */}
              <Parrafo className="text-3xl leading-none text-stone-900 md:text-4xl text-right" peso="semibold">
                ${formatMoney(item.precioUnitario * item.cantidad)} {MONEDA}
              </Parrafo>
              <Parrafo className="mt-1 text-sm text-[#8A7D2F] md:text-base text-right">
                ${formatMoney(item.precioUnitario)}/{item.unidad} {MONEDA}
              </Parrafo>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
