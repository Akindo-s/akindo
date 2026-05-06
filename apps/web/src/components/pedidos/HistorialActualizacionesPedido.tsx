"use client";

import type { PedidoActualizacionResponse } from "@/lib/types/pedidos";

interface HistorialActualizacionesPedidoProps {
  actualizaciones: PedidoActualizacionResponse[];
  titulo?: string;
}

export function HistorialActualizacionesPedido({
  actualizaciones,
  titulo = "Historial de Actualizaciones"
}: HistorialActualizacionesPedidoProps) {
  const formatFecha = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const isCancelado = actualizaciones.some(a => a.estado_nuevo === 'cancelado');

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{titulo}</p>
      <div className="space-y-4 pl-4 border-l-2 border-stone-100 ml-2">
        {actualizaciones.map((act, i) => {
          const isCancel = act.estado_nuevo === 'cancelado';
          return (
            <div key={act.id} className="relative">
              <div className={`absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-4 transition-colors z-10
                ${isCancel ? "bg-red-500 border-white shadow-sm" : "bg-white border-stone-200"}`} 
              />
              <div className={`rounded-2xl p-4 border transition-all duration-300
                ${isCancel 
                  ? "bg-red-50 border-red-100 shadow-sm shadow-red-100/50" 
                  : "bg-stone-50 border-stone-100"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-black uppercase tracking-tight 
                    ${isCancel ? "text-red-700" : "text-stone-800"}`}
                  >
                    {act.estado_nuevo}
                  </span>
                  <span className="text-[10px] font-medium text-stone-400">
                    {formatFecha(act.creado_at)}
                  </span>
                </div>
                {act.descripcion && (
                  <p className={`text-xs leading-relaxed italic
                    ${isCancel ? "text-red-600/80" : "text-stone-600"}`}
                  >
                    "{act.descripcion}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
