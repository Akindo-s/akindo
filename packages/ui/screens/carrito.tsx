/** @jsxImportSource nativewind */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { MONEDA } from "@akindo/shared/constants";
import { emitir } from "@akindo/shared/eventos";
import type {
  CarritoActionResult,
  CarritoUiData,
  CarritoUiItem,
} from "@akindo/shared/types/carrito";
import { P, Section, Span } from "@akindo/ui/html";
import { Boton, Link } from "@akindo/ui/components";
import { Tarjeta } from "@akindo/ui/components/ui/Tarjeta";
import { EncabezadoPagina } from "@akindo/ui/components/ui/EncabezadoPagina";
import { ContenedorPantalla } from "@akindo/ui/components/ui/ContenedorPantalla";
import { Spinner } from "@akindo/ui/components/ui/Animaciones";
import { useAviso } from "@akindo/ui/components/ui/Avisos";
import FooterFijo from "@akindo/ui/components/layout/FooterFijo";
import CarritoItemCard from "@akindo/ui/components/carrito/CarritoItemCard";

interface CarritoProps {
  /**
   * Carrito ya cargado. Web lo trae del servidor (sin parpadeo, regla 30);
   * mobile pasa `null` y la pantalla lo pide con `recargarCarritoAction`.
   */
  initialData: CarritoUiData | null;
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

function isRetryableResult(result: CarritoActionResult): boolean { // TODO : hay que modularizar este patron
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

export default function Carrito({
  initialData,
  actualizarCantidadAction,
  eliminarItemAction,
  vaciarCarritosAction,
  recargarCarritoAction,
}: CarritoProps) {
  const [data, setData] = useState<CarritoUiData | null>(initialData);
  const [pendingQtyByKey, setPendingQtyByKey] = useState<Record<string, number>>(
    {}
  );
  const pendingQtyByKeyRef = useRef<Record<string, number>>({});
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [savingByKey, setSavingByKey] = useState<Record<string, boolean>>({});
  const [itemProcesando, setItemProcesando] = useState<string | null>(null);
  // El error lo pinta la `VentanaEmergente` del layout (ver Avisos.tsx).
  const avisar = useAviso();
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

  // Mobile entra sin datos: los pide al montar. En web `initialData` ya viene
  // del servidor y este efecto no hace nada.
  const [errorCarga, setErrorCarga] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    if (initialData) return;
    let vigente = true;
    setErrorCarga(false);
    recargarCarritoAction().then(
      (carrito) => { if (vigente) setData(carrito); },
      // Sin esto, un token vencido dejaba la pantalla girando para siempre
      // (en web el error lo tira el servidor antes de pintar la página).
      () => { if (vigente) setErrorCarga(true); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const viewData = useMemo(
    () => (data ? deriveViewData(data, pendingQtyByKey) : null),
    [data, pendingQtyByKey]
  );

  const disabledGlobal = isGlobalPending;
  const hasItems = !!viewData && viewData.items.length > 0;

  const resumen = useMemo(
    () => viewData ? [
      { label: `Subtotal (${viewData.totalArticulos})`, value: `$${formatMoney(viewData.subtotal)} ${MONEDA}` },
      { label: "Gastos de envío estimados", value: viewData.envio === 0 ? "Gratis" : `$${formatMoney(viewData.envio)} ${MONEDA}` },
      {
        label: "Impuestos",
        value: viewData.impuestos === 0 ? "Se calculará en el siguiente paso" : `$${formatMoney(viewData.impuestos)} ${MONEDA}`,
      },
    ] : [],
    [viewData]
  );

  const aplicarResultadoGlobal = async (result: CarritoActionResult) => {
    if (!result.ok) {
      avisar(result.error ?? "No se pudo completar la acción");
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

    // En web `emitir` además dispara el CustomEvent en `window`, que es lo que
    // escuchaba el badge del Header.
    emitir("carrito:updated");
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
      emitir("carrito:updated");
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
    avisar(result.error ?? "No se pudo actualizar el carrito");
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

  // Solo lo ve mobile, mientras pide el carrito (o si la carga falló).
  if (!viewData) {
    return (
      <Section className="mx-auto flex w-full max-w-2xl flex-col">
        <EncabezadoPagina titulo="Tu carrito" href="/mercado" className="mb-2" />
        {errorCarga ? (
          <View className="px-4">
            <Tarjeta>
              <P className="text-sm text-stone-500 text-center">No se pudo cargar tu carrito.</P>
              <Boton variante="secundario" className="mt-3 w-full" onClick={() => setIntento((n) => n + 1)}>
                Volver a intentar
              </Boton>
            </Tarjeta>
          </View>
        ) : (
          <View className="flex items-center justify-center py-20">
            <Spinner tamano={32} />
          </View>
        )}
      </Section>
    );
  }

  return (
    <>
      {/* indiceFijo 0: el encabezado. `pb-72` deja lugar para el FooterFijo. */}
      <ContenedorPantalla key="carrito" indiceFijo={0} className="mx-auto flex w-full max-w-2xl flex-col pb-72">
        <EncabezadoPagina titulo="Tu carrito" href="/mercado" className="mb-2" />

        {success ? (
          <View className="mx-4 mb-3 rounded-xl border border-amber-700/20 bg-amber-500 px-4 py-3 drop-shadow-sm">
            <Span peso="bold" className="text-sm uppercase text-stone-900">{success.message}</Span>
          </View>
        ) : null}

        {/* `space-y-4` del original: en una columna, `gap-4` da lo mismo. */}
        <View className="flex flex-col gap-4 px-4">
          {hasItems ? (
            <>
              {viewData.grupos.map((grupo) => (
                <Tarjeta key={grupo.carritoId} conPadding={false} className="p-3">
                  <View className="mb-3 flex flex-row items-center justify-between border-b border-stone-200 pb-3 gap-2">
                    <Link
                      href={`/mercado/distribuidor/tienda?d=${grupo.distribuidorId}`}
                      bloque
                      className="flex min-w-0 flex-row items-center gap-2 shrink"
                    >
                      <View className="h-10 w-10 min-w-10 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                        {grupo.distribuidorImagenPerfil ? (
                          <Image
                            source={{ uri: grupo.distribuidorImagenPerfil }}
                            accessibilityLabel={grupo.distribuidorNombre}
                            resizeMode="cover"
                            className="h-full w-full"
                          />
                        ) : null}
                      </View>
                      <View className="min-w-0 shrink">
                        <P peso="semibold" numberOfLines={1} className="text-sm text-stone-900">
                          {grupo.distribuidorNombre}
                        </P>
                        <P className="text-xs text-stone-500">Ver tienda</P>
                      </View>
                    </Link>
                    <P peso="medium" className="text-xs text-stone-600 min-w-fit">
                      {grupo.totalArticulos} art. · ${formatMoney(grupo.subtotal)} {MONEDA}
                    </P>
                  </View>
                  <View className="flex flex-col gap-3">
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
                  </View>
                </Tarjeta>
              ))}

              {/* opciones generales */}
              <View className="flex flex-row items-center justify-between gap-2">
                <Boton
                  variante="peligro"
                  onClick={vaciarTodo}
                  disabled={disabledGlobal || !hasItems}
                  Icono={Trash2}
                >
                  Vaciar carritos
                </Boton>
              </View>
            </>
          ) : (
            <Tarjeta>
              <P className="text-sm text-stone-500 text-center">Tu carrito está vacío.</P>
              <Boton href="/mercado" variante="secundario" className="mt-3 w-full">
                Explorar productos
              </Boton>
            </Tarjeta>
          )}
        </View>
      </ContenedorPantalla>

      {/* Fuera del ScrollView: en nativo, adentro se iría con el scroll. */}
      <FooterFijo className="max-w-full rounded-t-2xl">
        <View className="w-full flex flex-col gap-2">
          <View className="rounded-xl bg-[#F3EBE0] p-4">
            {/* `last:mb-0` del original: nativewind no tiene la variante `last:`,
                así que el margen se decide por índice. */}
            {resumen.map((row, i) => (
              <View key={row.label} className={`flex flex-row items-center justify-between ${i === resumen.length - 1 ? "" : "mb-1"}`}>
                <Span className="text-sm text-stone-700 shrink">{row.label}</Span>
                <Span className="text-sm text-stone-700">{row.value}</Span>
              </View>
            ))}
            <View className="mt-3 flex flex-row items-end justify-between border-t border-stone-300 pt-2">
              <Span peso="semibold" className="text-base text-stone-900">Total</Span>
              <View>
                <P peso="bold" className="text-4xl leading-none text-stone-900 text-right">
                  ${formatMoney(viewData.total)}
                </P>
                {/* `leading-5`: el `text-[10px]` no trae interlineado y en web heredaba
                    los 20px del `text-sm` del contenedor del resumen (regla 19). */}
                <P className="text-[10px] leading-5 uppercase text-stone-500 text-right">{MONEDA}</P>
              </View>
            </View>
          </View>
          <Boton
            variante="primario"
            className="w-full"
            disabled={!hasItems || disabledGlobal}
            href={hasItems ? `/carrito/preorden?distribuidor_id=${viewData.grupos[0].distribuidorId}` : undefined}
          >
            Continuar con el pago
          </Boton>
        </View>
      </FooterFijo>
    </>
  );
}
