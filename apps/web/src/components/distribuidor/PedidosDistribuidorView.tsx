"use client";

import { useState } from "react";
import Link from "next/link";
import { Truck, CheckCircle2, Clock, MapPin, XCircle, ChevronDown } from "lucide-react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import type { PedidoListItem, EstadoPedido, PedidoResponse, PedidoActionResult } from "@/lib/types/pedidos";
import { HeaderSticky } from "@/components/ui/HeaderSticky";

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

function ActualizarEstadoModal({
  pedido,
  onClose,
  onConfirm,
  loading
}: {
  pedido: PedidoListItem;
  onClose: () => void;
  onConfirm: (estado: EstadoPedido, desc: string) => void;
  loading: boolean;
}) {
  // Solo se puede transicionar "hacia adelante" o cancelar
  const opciones = 
    pedido.estado === "pendiente de envio" 
      ? [{ val: "en envio", label: "En Tránsito" }, { val: "cancelado", label: "Cancelar Pedido" }]
      : [{ val: "entregado", label: "Entregado" }, { val: "cancelado", label: "Cancelar Pedido" }];

  const [estadoSelect, setEstadoSelect] = useState<EstadoPedido>(opciones[0].val as EstadoPedido);
  const [desc, setDesc] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <Tarjeta className="w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-stone-900 mb-2">Actualizar Pedido</h3>
        <p className="text-sm text-stone-500 mb-4">
          Actualiza el estado del pedido <strong>#{pedido.id.slice(0, 8)}</strong> de <strong>{pedido.cliente_nombre}</strong>.
        </p>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <select
              value={estadoSelect}
              onChange={(e) => setEstadoSelect(e.target.value as EstadoPedido)}
              className="w-full appearance-none p-3 pr-10 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
            >
              {opciones.map(op => <option key={op.val} value={op.val}>{op.label}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3.5 text-stone-400 pointer-events-none" />
          </div>

          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Mensaje para el cliente (ej. Tu pedido va en camino por DHL...)"
            className="w-full p-3 bg-white border border-stone-200 rounded-xl text-sm min-h-[80px] resize-none focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
          />
        </div>

        <div className="flex gap-3">
          <Boton variante="secundario" onClick={onClose} className="!w-full">
            Volver
          </Boton>
          <Boton 
            variante={estadoSelect === "cancelado" ? "peligro" : "primario"}
            onClick={() => onConfirm(estadoSelect, desc)} 
            loading={loading}
            className={estadoSelect === "cancelado" ? "!w-full bg-red-600 text-white hover:bg-red-700 border-none" : "!w-full"}
          >
            Actualizar
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Activos", "Historial"] as const;
type Tab = (typeof TABS)[number];

interface PedidosDistribuidorViewProps {
  activos: PedidoListItem[];
  historial: PedidoListItem[];
  actualizarAction: (id: string, estado: EstadoPedido, desc?: string) => Promise<PedidoActionResult<PedidoResponse>>;
}

export default function PedidosDistribuidorView({
  activos: activosInit,
  historial: historialInit,
  actualizarAction,
}: PedidosDistribuidorViewProps) {
  const [tab, setTab] = useState<Tab>("Activos");
  
  const [activos, setActivos] = useState(activosInit);
  const [historial, setHistorial] = useState(historialInit);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pedidoAActualizar, setPedidoAActualizar] = useState<PedidoListItem | null>(null);

  const mostrados = tab === "Activos" ? activos : historial;

  const handleActualizar = async (estadoNuevo: EstadoPedido, desc: string) => {
    if (!pedidoAActualizar) return;
    setLoadingId(pedidoAActualizar.id);
    const res = await actualizarAction(pedidoAActualizar.id, estadoNuevo, desc);
    setLoadingId(null);
    setPedidoAActualizar(null);
    
    if (!res.ok) {
      setError(res.error ?? "No se pudo actualizar el pedido");
      return;
    }

    const pedidoModificado = { ...pedidoAActualizar, estado: estadoNuevo };
    if (estadoNuevo === "entregado" || estadoNuevo === "cancelado") {
      setActivos(a => a.filter(p => p.id !== pedidoModificado.id));
      setHistorial(h => [pedidoModificado, ...h]);
    } else {
      setActivos(a => a.map(p => p.id === pedidoModificado.id ? pedidoModificado : p));
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl pb-20">
      <HeaderSticky titulo="Gestión de Pedidos" />
      
      <div className="px-4 pt-8">
        <p className="text-sm text-stone-500 mt-1">
          Actualiza el estado de los pedidos activos para mantener informados a tus clientes.
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-stone-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap
              ${tab === t 
                ? "bg-stone-900 text-white" 
                : "bg-white text-stone-500 hover:bg-stone-100"}`}
          >
            {t}
            {t === "Activos" && activos.length > 0 && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold
                ${tab === t ? "bg-amber-500 text-stone-900" : "bg-amber-100 text-amber-700"}`}>
                {activos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {mostrados.length === 0 ? (
          <div className="py-16 text-center">
            <Truck size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500 font-medium">No hay pedidos {tab.toLowerCase()}</p>
          </div>
        ) : (
          mostrados.map((pedido) => (
            <Tarjeta key={pedido.id} className="flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden">
              <div className="flex-1 w-full pl-2">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-bold text-stone-400 tracking-wider uppercase">
                    #{pedido.id.slice(0, 8)}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide
                    ${pedido.estado === "pendiente de envio" ? "bg-amber-100 text-amber-700" :
                      pedido.estado === "en envio" ? "bg-blue-100 text-blue-700" :
                      pedido.estado === "entregado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {pedido.estado === "pendiente de envio" ? "Pendiente" : 
                     pedido.estado === "en envio" ? "En Tránsito" : 
                     pedido.estado}
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">{pedido.cliente_nombre}</h3>
                <p className="text-xs text-stone-500">{pedido.primer_producto_nombre} ...</p>
              </div>

              <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-stone-100 pt-3 md:pt-0 md:pl-4 text-xs text-stone-500 space-y-1">
                <div className="flex justify-between">
                  <span>Confirmado:</span>
                  <span className="font-medium text-stone-800">{formatFecha(pedido.confirmado_at)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-stone-50">
                  <span className="text-stone-800">Total:</span>
                  <span className="text-[var(--color-primary-600)]">${formatMoney(pedido.total)}</span>
                </div>
              </div>

              {tab === "Activos" && (
                <div className="w-full md:w-auto mt-2 md:mt-0 flex-shrink-0 flex gap-2">
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="flex-1 md:flex-none"
                  >
                    <Boton
                      variante="secundario"
                      className="!w-full !text-xs !py-2.5"
                    >
                      Ver detalle
                    </Boton>
                  </Link>
                  <Boton
                    variante="primario"
                    className="flex-1 md:flex-none !text-xs !py-2.5"
                    onClick={() => setPedidoAActualizar(pedido)}
                  >
                    Actualizar
                  </Boton>
                </div>
              )}

              {tab === "Historial" && (
                <div className="w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                  <Link href={`/pedidos/${pedido.id}`}>
                    <Boton
                      variante="secundario"
                      className="!w-full !text-xs !py-2.5"
                    >
                      Ver detalle
                    </Boton>
                  </Link>
                </div>
              )}
            </Tarjeta>
          ))
        )}
      </div>

      {pedidoAActualizar && (
        <ActualizarEstadoModal 
          pedido={pedidoAActualizar}
          onClose={() => setPedidoAActualizar(null)}
          onConfirm={handleActualizar}
          loading={loadingId === pedidoAActualizar.id}
        />
      )}

      {error && <VentanaEmergente mensaje={error} onClose={() => setError(null)} />}
    </section>
  );
}
