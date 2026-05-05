"use client";

import { MONEDA } from "@/lib/api/constants";
import QuantityStepper from "./QuantityStepper";
import { CarritoUiItem } from "@/lib/types/carrito";
import { Parrafo } from "../titles";
import Link from "next/link";

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
    <article className="rounded-3xl border border-[#DDD3C7] bg-[#F2ECE6] p-5 shadow-sm">
      <div className="flex gap-5">
        <Link href={`/mercado/productos/detalle?p=${item.productoId}`}>
        <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-stone-100">
          {item.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
            src={item.imagen}
            alt={item.nombre}
            className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-500">
              Sin imagen
            </div>
          )}
          {isUpdating ? (
            <div className="absolute inset-0 flex items-start justify-end p-2">
              <div className="h-4 w-4 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin bg-white/70" />
            </div>
          ) : null}
        </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-stone-900 md:text-2xl">
              {item.nombre}
            </h3>
            <button
              type="button"
              onClick={onRemove}
              disabled={isUpdating}
              aria-label={`Eliminar ${item.nombre}`}
              className="text-3xl leading-none text-stone-500 hover:text-stone-800 disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <Parrafo className="text-sm text-stone-600 md:text-base">Distribuidor: {distribuidorNombre}</Parrafo>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <QuantityStepper
              value={item.cantidad}
              min={item.cantidadMinima}
              suffix={item.unidad}
              disabled={isUpdating}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
            />
            <div className="text-right">
              <Parrafo className="text-3xl font-semibold leading-none text-stone-900 md:text-4xl">
                ${formatMoney(item.precioUnitario * item.cantidad)} {MONEDA}
              </Parrafo>
              <Parrafo className="mt-1 text-sm font-normal text-[#8A7D2F] md:text-base">
                ${formatMoney(item.precioUnitario)}/{item.unidad} {MONEDA}
              </Parrafo>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
