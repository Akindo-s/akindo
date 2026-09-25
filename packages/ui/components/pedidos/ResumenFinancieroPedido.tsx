/** @jsxImportSource nativewind */
"use client";

import { useState } from "react";
import { View } from "react-native";
import { Info } from "lucide-react-native";
import { P, Pressable, Span } from "../html-elements";
import { Tarjeta } from "../ui/Tarjeta";

interface ResumenFinancieroProps {
  total: number;
  comision?: number;
  /** Cambia los textos y los colores: ganancia neta en vez de total pagado. */
  esDistribuidor?: boolean;
  moneda?: string;
}

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Resumen de dinero del pedido. Lo usan el detalle del pedido del distribuidor
 * y el de la orden de compra.
 */
export function ResumenFinancieroPedido({
  total,
  comision = 0,
  esDistribuidor = false,
  moneda = "MXN",
}: ResumenFinancieroProps) {
  // El `group-hover` del globito no existe en nativo (regla 47). En web se abre
  // al pasar el mouse por el ícono; en nativo, al tocarlo.
  const [tooltip, setTooltip] = useState(false);

  // Para el cliente: total es lo que pagó.
  // Para el distribuidor: total es su ganancia neta. Venta bruta = total + comision.
  const ventaBruta = total + comision;

  return (
    <View className="flex flex-col gap-2">
      <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px]">
        {esDistribuidor ? "Resumen Financiero" : "Resumen del Pago"}
      </P>

      <Tarjeta className={esDistribuidor ? "bg-stone-50 border-stone-200" : "bg-amber-50/50 border-amber-100"}>
        <View className="flex flex-col gap-3">
          <View className="flex flex-row justify-between items-center">
            <Span peso="medium" className="text-sm text-stone-500">{esDistribuidor ? "Venta bruta" : "Subtotal"}</Span>
            <Span peso="bold" className="text-sm text-stone-700">${formatMoney(ventaBruta)}</Span>
          </View>

          <View className="flex flex-row justify-between items-center">
            <View className="flex flex-row items-center gap-1.5 shrink">
              <Span peso="medium" className="text-sm text-stone-500 shrink">
                {esDistribuidor ? "Comisión de servicio" : "Costo de envío e impuestos"}
              </Span>
              {esDistribuidor && (
                <View className="relative">
                  <Pressable
                    role="button"
                    accessibilityLabel="Qué es la comisión de servicio"
                    onPress={() => setTooltip((v) => !v)}
                    onHoverIn={() => setTooltip(true)}
                    onHoverOut={() => setTooltip(false)}
                    className="cursor-help"
                  >
                    <Info size={12} color="#D6D3D1" />
                  </Pressable>
                  {tooltip && (
                    // `z-10` y `elevation`: tiene que quedar por encima de la
                    // tarjeta, que lleva sombra (regla 6).
                    <View className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-900 rounded-lg z-10 elevation-[10] shadow-xl">
                      <Span className="text-white text-[10px] leading-normal">
                        Esta comisión se descuenta automáticamente por el uso de la plataforma.
                      </Span>
                    </View>
                  )}
                </View>
              )}
            </View>
            <Span peso="bold" className={`text-sm shrink-0 ${esDistribuidor ? "text-red-500" : "text-stone-700"}`}>
              {esDistribuidor ? "-" : ""}${formatMoney(comision)}
            </Span>
          </View>

          <View className={`pt-3 border-t flex flex-row justify-between items-end ${esDistribuidor ? "border-stone-200" : "border-amber-200"}`}>
            <View>
              {/* `font-black` (900): la familia llega a 800, igual que en web. */}
              <P peso="extrabold" className={`text-[10px] leading-normal uppercase tracking-[1px] ${esDistribuidor ? "text-stone-400" : "text-amber-600"}`}>
                {esDistribuidor ? "Ganancia Neta" : "Total Pagado"}
              </P>
              <View className="flex flex-row items-baseline gap-1">
                <Span peso="extrabold" className={`text-2xl ${esDistribuidor ? "text-stone-900" : "text-amber-700"}`}>
                  ${formatMoney(total)}
                </Span>
                <Span peso="bold" className="text-[10px] leading-normal text-stone-400 uppercase">{moneda}</Span>
              </View>
            </View>

            {!esDistribuidor && (
              <View className="bg-amber-100 px-2 py-1 rounded-lg drop-shadow-sm border border-amber-200">
                <Span peso="extrabold" className="text-amber-700 text-[10px] leading-normal uppercase tracking-[-0.5px]">
                  Pagado
                </Span>
              </View>
            )}
          </View>
        </View>
      </Tarjeta>
    </View>
  );
}
