/** @jsxImportSource nativewind */
"use client";

import { View } from "react-native";
import type { PedidoActualizacion } from "@akindo/shared/types/pedidos";
import { P, Span } from "../html-elements";

interface HistorialActualizacionesPedidoProps {
  actualizaciones: PedidoActualizacion[];
  titulo?: string;
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

/**
 * Línea de tiempo de los cambios de estado del pedido. La usa el detalle del
 * cliente y (más adelante) el del distribuidor.
 */
export function HistorialActualizacionesPedido({
  actualizaciones,
  titulo = "Historial de Actualizaciones"
}: HistorialActualizacionesPedidoProps) {
  return (
    <View className="flex flex-col gap-3">
      <P peso="semibold" className="text-xs text-stone-500 uppercase tracking-[0.3px]">{titulo}</P>
      {/* `space-y-4` → `gap-4` (regla 44). */}
      <View className="flex flex-col gap-4 pl-4 border-l-2 border-stone-100 ml-2">
        {actualizaciones.map((act) => {
          const cancelado = act.estado_nuevo === "cancelado";
          return (
            <View key={act.id} className="relative">
              {/* El punto sobre la línea. */}
              <View
                className={`absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-4 z-10 ${
                  cancelado ? "bg-red-500 border-white shadow-sm" : "bg-white border-stone-200"
                }`}
              />
              <View
                className={`rounded-2xl p-4 border ${
                  cancelado ? "bg-red-50 border-red-100 shadow-sm" : "bg-stone-50 border-stone-100"
                }`}
              >
                <View className="flex flex-row justify-between items-start mb-2">
                  {/* `font-black` (900): la familia llega a 800, igual que en web. */}
                  <Span
                    peso="extrabold"
                    className={`text-xs uppercase tracking-[-0.3px] shrink ${cancelado ? "text-red-700" : "text-stone-800"}`}
                  >
                    {act.estado_nuevo}
                  </Span>
                  <Span peso="medium" className="text-[10px] leading-normal text-stone-400 shrink-0">
                    {formatFecha(act.creado_at)}
                  </Span>
                </View>
                {act.descripcion && (
                  <P className={`text-xs leading-relaxed italic ${cancelado ? "text-red-600/80" : "text-stone-600"}`}>
                    "{act.descripcion}"
                  </P>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
