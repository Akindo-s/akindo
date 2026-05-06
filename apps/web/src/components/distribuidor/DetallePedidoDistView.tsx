"use client";

import { useState } from "react";
import { 
  Package2, 
  MapPin, 
  Calendar, 
  User, 
  ChevronDown, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle,
  MessageCircle,
  AlertCircle,
  Star
} from "lucide-react";
import { HeaderSticky } from "@/components/ui/HeaderSticky";
import { Boton } from "@/components/ui/Boton";
import { ResumenFinancieroPedido } from "@/components/pedidos/ResumenFinancieroPedido";
import { ListaProductosPedido } from "@/components/pedidos/ListaProductosPedido";
import { HistorialActualizacionesPedido } from "@/components/pedidos/HistorialActualizacionesPedido";
import type { PedidoResponse, EstadoPedido, PedidoActionResult } from "@/lib/types/pedidos";
import { Tarjeta } from "../ui/Tarjeta";

const MONEDA = "MXN";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

const ESTADOS_DISPONIBLES: { label: string; valor: EstadoPedido; Icon: any; color: string }[] = [
  { label: "Pendiente de Envío", valor: "pendiente de envio", Icon: Clock, color: "text-amber-600" },
  { label: "En Envío", valor: "en envio", Icon: Truck, color: "text-blue-600" },
  { label: "Entregado", valor: "entregado", Icon: CheckCircle2, color: "text-green-600" },
  { label: "Cancelado", valor: "cancelado", Icon: XCircle, color: "text-red-600" },
];

export default function DetallePedidoDistView({
  pedido: pedidoInicial,
  actualizarEstadoAction,
}: {
  pedido: PedidoResponse;
  actualizarEstadoAction: (estado: EstadoPedido, descripcion?: string) => Promise<PedidoActionResult<PedidoResponse>>;
}) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPedido>(pedido.estado as EstadoPedido);
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActualizar = async () => {
    if (nuevoEstado === pedido.estado && !descripcion) return;
    setLoading(true);
    setError(null);
    const res = await actualizarEstadoAction(nuevoEstado, descripcion);
    setLoading(false);
    if (res.ok && res.data) {
      setPedido(res.data);
      setDescripcion("");
    } else {
      setError(res.error ?? "No se pudo actualizar el estado");
    }
  };
  
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col pb-20">
      <HeaderSticky titulo={`Pedido #${pedido.id.slice(0, 8)}`} />
      
      <div className="px-4 pt-4 space-y-6">
        
        {/* Card de Actualización de Estado - Solo si no está finalizado */}
        {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' ? (
          <Tarjeta className="border-l-4 border-l-[var(--color-primary-500)] shadow-md animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-[var(--color-primary-600)]" />
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight">Actualizar Estado</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Nuevo Estado</label>
                <div className="relative">
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value as EstadoPedido)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] transition-all"
                  >
                    {ESTADOS_DISPONIBLES.map((e) => (
                      <option key={e.valor} value={e.valor}>{e.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-stone-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Nota de actualización (opcional)</label>
                <div className="relative">
                  <MessageCircle size={16} className="absolute left-3 top-3 text-stone-300" />
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: El repartidor está en camino..."
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] min-h-[44px] resize-none transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Boton
                onClick={handleActualizar}
                loading={loading}
                disabled={nuevoEstado === pedido.estado && !descripcion}
                className="!px-8 shadow-sm"
              >
                Guardar Cambios
              </Boton>
            </div>
            {error && <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1"><XCircle size={12} /> {error}</p>}
          </Tarjeta>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-900">Pedido Finalizado</p>
              <p className="text-xs text-green-700">Este pedido ya se encuentra en estado {pedido.estado}.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Info del Cliente */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Información del Cliente</p>
            <Tarjeta className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center text-stone-400 border-2 border-stone-100">
                  {pedido.cliente_imagen ? (
                    <img src={pedido.cliente_imagen} alt={pedido.cliente_nombre || ""} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">{pedido.cliente_nombre || "Cliente Akindo"}</p>
                  <p className="text-xs text-stone-500">ID: {pedido.cliente_id?.slice(0, 8)}</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-3 border-t border-stone-50">
                <div className="flex gap-2 p-3 bg-[var(--color-primary-50)] rounded-2xl border border-[var(--color-primary-100)] ring-4 ring-[var(--color-primary-50)]/50">
                  <MapPin size={18} className="text-[var(--color-primary-600)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[var(--color-primary-700)] uppercase tracking-wide">Dirección de Entrega</p>
                    <p className="text-sm text-wrap font-bold text-stone-800 leading-relaxed">
                      {pedido.direccion_entrega?.calle} {(pedido.direccion_entrega as any)?.numero_exterior && `, ${(pedido.direccion_entrega as any).numero_exterior}`}, 
                      {(pedido.direccion_entrega as any)?.colonia && ` ${(pedido.direccion_entrega as any).colonia},`} {(pedido.direccion_entrega as any)?.municipio && ` ${(pedido.direccion_entrega as any).municipio},`}
                      {pedido.direccion_entrega?.estado}, CP {pedido.direccion_entrega?.codigo_postal}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Calendar size={16} className="text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Fecha del Pedido</p>
                    <p className="text-xs text-stone-700">{formatFecha(pedido.confirmado_at)}</p>
                  </div>
                </div>
              </div>
            </Tarjeta>
          </div>

          {/* Resumen Financiero Unificado */}
          <ResumenFinancieroPedido 
            total={pedido.total} 
            comision={pedido.comision_servicio} 
            esDistribuidor={true} 
          />
        </div>

        {/* Valoración del Cliente (si existe) */}
        {pedido.tiene_valoracion && pedido.valoracion && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Valoración del Cliente</p>
            <Tarjeta className="bg-amber-50/30 border-amber-100/50">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-amber-100 text-center min-w-[60px]">
                  <p className="text-2xl font-black text-amber-600 leading-none">{pedido.valoracion.puntuacion}</p>
                  <div className="flex justify-center gap-0.5 mt-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={8} 
                        className={s <= pedido.valoracion!.puntuacion ? "fill-amber-400 text-amber-400" : "text-stone-200"} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-stone-800 mb-1">Comentario:</p>
                  <p className="text-sm text-stone-600 leading-relaxed italic">
                    "{pedido.valoracion.comentario || "Sin comentarios adicionales."}"
                  </p>
                  <p className="text-[10px] text-stone-400 mt-2 font-medium uppercase tracking-tight">
                    Recibida el {formatFecha(pedido.valoracion.created_at)}
                  </p>
                </div>
              </div>
            </Tarjeta>
          </div>
        )}

        {/* Productos */}
        <ListaProductosPedido 
          productos={pedido.paquetes} 
          titulo="Productos solicitados" 
          conLinks
          vistaDistribuidor
        />

        {/* Historial de actualizaciones */}
        <HistorialActualizacionesPedido 
          actualizaciones={pedido.actualizaciones} 
        />
      </div>
    </section>
  );
}
