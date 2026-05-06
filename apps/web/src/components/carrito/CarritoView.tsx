"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import FooterFijo from "@/components/layout/FooterFijo";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import CarritoItemCard from "./CarritoItemCard";
import {
  CarritoActionResult,
  CarritoUiData,
  CarritoUiItem,
} from "@/lib/types/carrito";
import { MONEDA } from "@/lib/api/constants";
import { Trash2 } from "lucide-react";

interface CarritoViewProps {
  initialData: CarritoUiData;
  actualizarCantidadAction: (
    distribuidorId: string,
    productoId: string,
    cantidad: number
  ) => Promise<CarritoActionResult>;
  eliminarItemAction: (
    distribuidorId: string,
    productoId: string
  ) => Promise<CarritoActionResult>;
  vaciarCarritosAction: () => Promise<CarritoActionResult>;
  recargarCarritoAction: () => Promise<CarritoUiData>;
}

type SuccessToast = { message: string } | null;
const DEBOUNCE_MS = 800;
const RETRY_DELAYS_MS = [250, 700];

function formatMoney(value: number): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isRetryableResult(result: CarritoActionResult): boolean {
  if (typeof result.retryable === "boolean") return result.retryable;
  if (result.status === undefined) return true;
  if ([408, 429].includes(result.status)) return true;
  if (result.status >= 500) return true;
  return false;
}

/**
 * Calcula el precio unitario basado en los niveles de precio.
 * Replicado de la lógica del servidor para una UI reactiva inmediata.
 */
function calcularPrecioUnitario(
  baseCosto: number,
  niveles: { cantidad_minima: number; costo_por_medida: number }[] | undefined,
  cantidad: number
): number {
  if (!niveles || niveles.length === 0) return baseCosto;
  const sortedTiers = [...niveles].sort((a, b) => a.cantidad_minima - b.cantidad_minima);
  for (const tier of sortedTiers) {
    if (cantidad < tier.cantidad_minima) {
      return tier.costo_por_medida;
    }
  }
  return sortedTiers[sortedTiers.length - 1].costo_por_medida;
}

function deriveViewData(
  baseData: CarritoUiData,
  pendingQtyByKey: Record<string, number>
): CarritoUiData {
  const grupos = baseData.grupos.map((grupo) => {
    const items = grupo.items.map((item) => {
      const nextQty = pendingQtyByKey[item.key] ?? item.cantidad;
      
      const precioUnitario = calcularPrecioUnitario(
        item.precioBase,
        item.nivelesPrecio,
        nextQty
      );
      
      return { 
        ...item, 
        cantidad: nextQty,
        precioUnitario
      };
    });
    
    const subtotal = items.reduce(
      (acc, item) => acc + item.precioUnitario * item.cantidad,
      0
    );
    const totalArticulos = items.reduce((acc, item) => acc + item.cantidad, 0);
    return { ...grupo, items, subtotal, totalArticulos };
  });

  const items = grupos.flatMap((grupo) => grupo.items);
  const subtotal = grupos.reduce((acc, grupo) => acc + grupo.subtotal, 0);
  const totalArticulos = items.reduce((acc, item) => acc + item.cantidad, 0);
  const envio = baseData.envio;
  const impuestos = baseData.impuestos;

  return {
    ...baseData,
    grupos,
    items,
    subtotal,
    totalArticulos,
    total: subtotal + envio + impuestos,
  };
}

export default function CarritoView({
  initialData,
  actualizarCantidadAction,
  eliminarItemAction,
  vaciarCarritosAction,
  recargarCarritoAction,
}: CarritoViewProps) {
  const [data, setData] = useState<CarritoUiData>(initialData);
  const [pendingQtyByKey, setPendingQtyByKey] = useState<Record<string, number>>(
    {}
  );
  const pendingQtyByKeyRef = useRef<Record<string, number>>({});
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [savingByKey, setSavingByKey] = useState<Record<string, boolean>>({});
  const [itemProcesando, setItemProcesando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessToast>(null);
  const [isGlobalPending, setIsGlobalPending] = useState(false);

  useEffect(() => {
    pendingQtyByKeyRef.current = pendingQtyByKey;
  }, [pendingQtyByKey]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    },
    []
  );

  const viewData = useMemo(
    () => deriveViewData(data, pendingQtyByKey),
    [data, pendingQtyByKey]
  );

  const disabledGlobal = isGlobalPending;
  const hasItems = viewData.items.length > 0;

  const resumen = useMemo(
    () => [
      { label: `Subtotal (${viewData.totalArticulos})`, value: `$${formatMoney(viewData.subtotal)} ${MONEDA}` },
      { label: "Gastos de envio estimados", value: viewData.envio === 0 ? "Gratis" : `$${formatMoney(viewData.envio)} ${MONEDA}` },
      {
        label: "Impuestos",
        value: viewData.impuestos === 0 ? "Se calculara en el siguiente paso" : `$${formatMoney(viewData.impuestos)} ${MONEDA}`,
      },
    ],
    [viewData.envio, viewData.impuestos, viewData.subtotal, viewData.totalArticulos]
  );

  const aplicarResultadoGlobal = async (result: CarritoActionResult) => {
    if (!result.ok) {
      setError(result.error ?? "No se pudo completar la accion");
      return;
    }

    if (result.data) {
      setData(result.data);
    } else {
      const refreshed = await recargarCarritoAction();
      setData(refreshed);
    }

    if (result.message) {
      setSuccess({ message: result.message });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("carrito:updated"));
    }
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const runUpdateWithRetry = async (
    item: CarritoUiItem,
    cantidad: number
  ): Promise<CarritoActionResult> => {
    let result = await actualizarCantidadAction(
      item.distribuidorId,
      item.productoId,
      cantidad
    );
    if (result.ok) return result;

    for (const delay of RETRY_DELAYS_MS) {
      if (!isRetryableResult(result)) break;
      await sleep(delay);
      result = await actualizarCantidadAction(
        item.distribuidorId,
        item.productoId,
        cantidad
      );
      if (result.ok) return result;
    }

    return result;
  };

  const clearItemTimer = (itemKey: string) => {
    const timer = timersRef.current.get(itemKey);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(itemKey);
    }
  };

  const flushItemUpdate = async (item: CarritoUiItem) => {
    const sentQty = pendingQtyByKeyRef.current[item.key];
    if (typeof sentQty !== "number") return;

    setSavingByKey((prev) => ({ ...prev, [item.key]: true }));
    const result = await runUpdateWithRetry(item, sentQty);

    if (result.ok) {
      const nextData = result.data ?? (await recargarCarritoAction());
      setData(nextData);
      setPendingQtyByKey((prev) => {
        if (prev[item.key] !== sentQty) return prev;
        const { [item.key]: _, ...rest } = prev;
        return rest;
      });
      setSavingByKey((prev) => {
        const { [item.key]: _, ...rest } = prev;
        return rest;
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("carrito:updated"));
      }
      return;
    }

    setPendingQtyByKey((prev) => {
      if (prev[item.key] !== sentQty) return prev;
      const { [item.key]: _, ...rest } = prev;
      return rest;
    });
    setSavingByKey((prev) => {
      const { [item.key]: _, ...rest } = prev;
      return rest;
    });
    setError(result.error ?? "No se pudo actualizar el carrito");
  };

  const scheduleDebouncedUpdate = (item: CarritoUiItem, cantidad: number) => {
    setPendingQtyByKey((prev) => ({ ...prev, [item.key]: cantidad }));
    clearItemTimer(item.key);
    const timer = setTimeout(() => {
      void flushItemUpdate(item);
    }, DEBOUNCE_MS);
    timersRef.current.set(item.key, timer);
  };

  const actualizarCantidadLocal = (item: CarritoUiItem, cantidad: number) => {
    scheduleDebouncedUpdate(item, Math.max(item.cantidadMinima, cantidad));
  };

  const eliminarItem = async (item: CarritoUiItem) => {
    clearItemTimer(item.key);
    setPendingQtyByKey((prev) => {
      const { [item.key]: _, ...rest } = prev;
      return rest;
    });
    setItemProcesando(item.key);
    const result = await eliminarItemAction(item.distribuidorId, item.productoId);
    await aplicarResultadoGlobal(result);
    setItemProcesando(null);
  };

  const vaciarTodo = async () => {
    setIsGlobalPending(true);
    for (const key of Object.keys(pendingQtyByKeyRef.current)) {
      clearItemTimer(key);
    }
    setPendingQtyByKey({});
    setSavingByKey({});
    const result = await vaciarCarritosAction();
    await aplicarResultadoGlobal(result);
    setIsGlobalPending(false);
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col pb-72">
      <EncabezadoPagina titulo="Tu carrito" href="/mercado" className="mb-2" />

      {success ? (
        <div className="mx-4 mb-3 rounded-xl border border-amber-700/20 bg-amber-500 px-4 py-3 text-stone-900 shadow-sm">
          <p className="text-sm font-bold uppercase">{success.message}</p>
        </div>
      ) : null}

      <div className="space-y-4 px-4">
        {hasItems ? (
          <>
            {viewData.grupos.map((grupo) => (
              <Tarjeta key={grupo.carritoId} conPadding={false} className="p-3">
                <div className="mb-3 flex items-center justify-between border-b border-stone-200 pb-3  gap-2">
                  <Link
                    href={`/mercado/distribuidor/tienda?d=${grupo.distribuidorId}`}
                    className="flex min-w-0 items-center gap-2"
                  >
                    <div className="h-10 w-10 min-w-10 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                      {grupo.distribuidorImagenPerfil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={grupo.distribuidorImagenPerfil}
                          alt={grupo.distribuidorNombre}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {grupo.distribuidorNombre}
                      </p>
                      <p className="text-xs text-stone-500">Ver tienda</p>
                    </div>
                  </Link>
                  <p className="text-xs font-medium text-stone-600 min-w-fit">
                    {grupo.totalArticulos} art. · ${formatMoney(grupo.subtotal)} {MONEDA}
                  </p>
                </div>
                <div className="space-y-3">
                  {grupo.items.map((item) => {
                    const isUpdating = Boolean(
                      itemProcesando === item.key || savingByKey[item.key]
                    );
                    return (
                      <CarritoItemCard
                        key={item.key}
                        item={item}
                        distribuidorNombre={grupo.distribuidorNombre}
                        isUpdating={isUpdating}
                        onIncrease={() =>
                          actualizarCantidadLocal(item, item.cantidad + 1)
                        }
                        onDecrease={() =>
                          actualizarCantidadLocal(
                            item,
                            Math.max(item.cantidadMinima, item.cantidad - 1)
                          )
                        }
                        onRemove={() => void eliminarItem(item)}
                      />
                    );
                  })}
                </div>
              </Tarjeta>
            ))}

            {/* opciones generales */}
            <div className="flex items-center justify-between gap-2">

              <Boton
                variante="peligro"
                onClick={vaciarTodo}
                disabled={disabledGlobal || !hasItems}
                Icono={Trash2}
              >
                Vaciar carritos
              </Boton>
            </div>
          </>
        ) : (
          <Tarjeta className="text-center">
            <p className="text-sm text-stone-500">Tu carrito esta vacio.</p>
            <Boton href="/mercado" variante="secundario" className="mt-3 !w-full">
              Explorar productos
            </Boton>
          </Tarjeta>
        )}
      </div>

      <FooterFijo className="w-2xl max-w-full  rounded-t-2xl">
        <div className="w-full space-y-2">
          <div className="rounded-xl bg-[#F3EBE0] p-4 text-sm text-stone-700">
            {resumen.map((row) => (
              <div key={row.label} className="mb-1 flex items-center justify-between last:mb-0">
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            <div className="mt-3 flex items-end justify-between border-t border-stone-300 pt-2">
              <span className="text-base font-semibold text-stone-900">Total</span>
              <div className="text-right">
                <p className="text-4xl font-bold leading-none text-stone-900">
                  ${formatMoney(viewData.total)}
                </p>
                <p className="text-[10px] uppercase text-stone-500">{MONEDA}</p>
              </div>
            </div>
          </div>
          <Boton
            variante="primario"
            className="!w-full"
            disabled={!hasItems || disabledGlobal}
            href={hasItems ? `/carrito/preorden?distribuidor_id=${viewData.grupos[0].distribuidorId}` : undefined}
          >
            Continuar con el pago
          </Boton>
        </div>
      </FooterFijo>

      {error ? <VentanaEmergente mensaje={error} onClose={() => setError(null)} /> : null}
    </section>
  );
}
