"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Package2, Clock, CheckCircle2, XCircle, ShoppingBag } from "lucide-react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { PedidoListItem, EstadoPedido, OrdenPedidoListItem } from "@/lib/types/pedidos";

const MONEDA = "MXN";

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Estado badge
const ESTADO_CONFIG: Record<EstadoPedido, { label: string; color: string; bg: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  "pendiente de envio": { label: "Procesando", color: "text-amber-700", bg: "bg-amber-100", Icon: Clock },
  "en envio": { label: "En Tránsito", color: "text-blue-700", bg: "bg-blue-100", Icon: ArrowRight },
  "entregado": { label: "Entregado", color: "text-green-700", bg: "bg-green-100", Icon: CheckCircle2 },
  "cancelado": { label: "Cancelado", color: "text-red-600", bg: "bg-red-100", Icon: XCircle },
};

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: "text-stone-600", bg: "bg-stone-100", Icon: Package2 };
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <cfg.Icon size={12} />
      {cfg.label}
    </span>
  );
}

function PedidoCard({ pedido }: { pedido: PedidoListItem }) {
  return (
    <Tarjeta className={`relative border-l-4 ${
      pedido.estado === "en envio" ? "border-l-blue-400" :
      pedido.estado === "pendiente de envio" ? "border-l-amber-400" :
      pedido.estado === "entregado" ? "border-l-green-400" :
      "border-l-stone-300"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
            PEDIDO #{pedido.id.slice(0, 8).toUpperCase()}
          </p>
          <h3 className="text-base font-bold text-stone-900 mt-0.5 leading-tight">
            {pedido.primer_producto_nombre ?? pedido.distribuidor_nombre ?? "Pedido"}
          </h3>
        </div>
        <EstadoBadge estado={pedido.estado} />
      </div>

      <div className="flex gap-6 mt-3 text-xs text-stone-500">
        <div>
          <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-400">Fecha de Pedido</p>
          <p className="text-stone-700 font-medium mt-0.5">{formatFecha(pedido.confirmado_at)}</p>
        </div>
        {pedido.entregado_at && (
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-400">Entregado</p>
            <p className="text-stone-700 font-medium mt-0.5">{formatFecha(pedido.entregado_at)}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">Total</p>
          <p className="text-xl font-extrabold text-stone-900">${formatMoney(pedido.total)} <span className="text-xs font-normal text-stone-400">{MONEDA}</span></p>
        </div>
        <Link
          href={`/pedidos/${pedido.id}`}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-600)] hover:underline"
        >
          Ver Detalles <ArrowRight size={14} />
        </Link>
      </div>
    </Tarjeta>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Activos", "Entregados", "Cancelados"] as const;
type Tab = (typeof TABS)[number];

interface MisPedidosViewProps {
  activos: PedidoListItem[];
  entregados: PedidoListItem[];
  cancelados: PedidoListItem[];
  ordenes: OrdenPedidoListItem[];
}

export default function MisPedidosView({ activos, entregados, cancelados, ordenes }: MisPedidosViewProps) {
  const [tab, setTab] = useState<Tab>("Activos");

  const pedidosMostrados = tab === "Activos" ? activos : tab === "Entregados" ? entregados : cancelados;

  return (
    <section className="mx-auto w-full max-w-6xl pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900">Pedidos</h1>
        <p className="text-sm text-stone-500 mt-0.5">Gestiona y da seguimiento a tus pedidos.</p>
      </div>

      {/* Acceso a Órdenes de Compra */}
      <div className="px-4 mb-6">
        <Link href="/pedidos/ordenes">
          <Tarjeta className="!bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:border-amber-200 transition-colors p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-800">Órdenes de Compra</h3>
                  <p className="text-[11px] text-stone-500">Pendientes de aprobación por distribuidor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ordenes.filter(o => o.estado === 'pendiente').length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {ordenes.filter(o => o.estado === 'pendiente').length}
                  </span>
                )}
                <ArrowRight size={16} className="text-stone-400" />
              </div>
            </div>
          </Tarjeta>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0
              ${tab === t
                ? "bg-[var(--color-primary-500)] text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"}`}
          >
            {t}
            {t === "Activos" && activos.length > 0 && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${tab === t ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}>
                {activos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidosMostrados.length === 0 ? (
          <Tarjeta className="col-span-full text-center py-10">
            <Package2 size={40} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 text-sm font-medium">No tienes pedidos {tab.toLowerCase()} aún.</p>
            {tab === "Activos" && (
              <Link
                href="/mercado"
                className="mt-3 inline-block text-sm text-[var(--color-primary-600)] font-semibold hover:underline"
              >
                Explorar productos →
              </Link>
            )}
          </Tarjeta>
        ) : (
          pedidosMostrados.map((p) => <PedidoCard key={p.id} pedido={p} />)
        )}
      </div>
    </section>
  );
}
