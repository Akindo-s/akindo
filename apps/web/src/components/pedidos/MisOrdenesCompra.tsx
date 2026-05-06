"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Package2,
  BadgeCheck,
} from "lucide-react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { cancelarOrden } from "@/lib/api/pedidos";
import { useRouter } from "next/navigation";
import type { EstadoOrden, OrdenPedidoListItem } from "@/lib/types/pedidos";

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Estado config ─────────────────────────────────────────────────────────────

type EstadoConfig = {
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  accentBar: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const ESTADO_CONFIG: Record<EstadoOrden, EstadoConfig> = {
  pendiente: {
    label: "Esperando respuesta",
    description: "El distribuidor aún no ha revisado tu orden.",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    accentBar: "bg-amber-400",
    Icon: Clock,
  },
  aceptada: {
    label: "Aceptada",
    description: "El distribuidor aceptó tu orden. Se está procesando.",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    accentBar: "bg-emerald-400",
    Icon: CheckCircle2,
  },
  rechazada: {
    label: "Rechazada",
    description: "El distribuidor no pudo procesar tu orden.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    accentBar: "bg-red-400",
    Icon: XCircle,
  },
  cancelada: {
    label: "Cancelada",
    description: "Has cancelado esta orden de compra.",
    color: "text-stone-500",
    bg: "bg-stone-50",
    border: "border-stone-200",
    accentBar: "bg-stone-300",
    Icon: XCircle,
  },
};

// ── OrdenCard ─────────────────────────────────────────────────────────────────

function OrdenCard({ orden }: { orden: OrdenPedidoListItem }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cfg = ESTADO_CONFIG[orden.estado] || ESTADO_CONFIG.pendiente;
  const Icon = cfg.Icon;

  async function handleCancelar() {
    setLoading(true);
    setError(null);
    const res = await cancelarOrden(orden.id);
    setLoading(false);
    if (res.ok) {
      setIsModalOpen(false);
      router.refresh();
    } else {
      setError(res.error ?? "No se pudo cancelar la orden");
    }
  }

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${cfg.border}  bg-white shadow-sm`}
    >
      

      {/* Main row — always visible */}
      <div className="p-4">
        {/* Distribuidor row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center text-amber-700 font-bold flex-shrink-0 text-sm">
            {orden.distribuidor_imagen ? (
              <img
                src={orden.distribuidor_imagen}
                alt={orden.distribuidor_nombre ?? "Distribuidor"}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <span>{orden.distribuidor_nombre?.charAt(0) ?? "D"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-800 truncate leading-tight">
              {orden.distribuidor_nombre ?? "Distribuidor"}
            </p>
            <p className="text-[10px] text-stone-400">
              {formatFecha(orden.created_at)}
            </p>
          </div>
          {/* Estado badge */}
          <span
            className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${cfg.bg} ${cfg.color}`}
          >
            <Icon size={11} />
            {cfg.label}
          </span>
        </div>

        {/* Status description */}
        <p className={`text-xs ${cfg.color} font-medium`}>
          {cfg.description}
        </p>

        {/* Footer: total + expand toggle + cancel button */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
              Total de la orden
            </p>
            <p className="text-lg font-extrabold text-stone-900">
              ${formatMoney(orden.total)}{" "}
              <span className="text-xs font-normal text-stone-400">MXN</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {orden.estado === "pendiente" && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-100"
            >
              {expanded ? (
                <>
                  Ocultar <ChevronUp size={14} />
                </>
              ) : (
                <>
                  Ver productos <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-red-500 font-medium mt-2">
            {error}
          </p>
        )}
      </div>

      <ModalConfirmacion
        isOpen={isModalOpen}
        onClose={() => !loading && setIsModalOpen(false)}
        onConfirm={handleCancelar}
        titulo="Cancelar Orden"
        mensaje="¿Estás seguro de que deseas cancelar esta orden de compra? Esta acción no se puede deshacer."
        textoConfirmar="Sí, cancelar orden"
        textoCancelar="No, mantener"
        isConfirming={loading}
      />

      {/* Expanded: product list + status explanation */}
      {expanded && (
        <div className={`border-t ${cfg.border}`}>
          {/* Product list */}
          {orden.paquetes.length > 0 && (
            <div className="divide-y divide-stone-100">
              {orden.paquetes.map((p) => {
                const prod = p as typeof p & { producto?: { nombre_producto?: string; imagen_producto?: string } };
                const nombre = prod?.nombre_producto ?? p.medida_snapshot?.nombre ?? "Producto";
                const imagen = prod?.imagen_producto ?? null;
                return (
                  <div key={String(p.producto_id)} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center text-stone-400 flex-shrink-0">
                      {imagen ? (
                        <img
                          src={imagen}
                          alt={nombre}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package2 size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{nombre}</p>
                      <p className="text-xs text-stone-400">
                        {p.cantidad} {p.medida_snapshot?.unidad ?? "pz"} x ${p.costo_unitario}MXN/{p.medida_snapshot?.unidad}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-stone-900 flex-shrink-0">
                      ${formatMoney(p.subtotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explanation footer */}
          <div className={`${cfg.bg} px-4 py-3 flex items-start gap-2`}>
            <AlertCircle size={14} className={`mt-0.5 flex-shrink-0 ${cfg.color}`} />
            <p className="text-xs text-stone-600">
              {orden.estado === "pendiente" && (
                <>Tu orden está en cola. El tiempo promedio de respuesta es de <strong>1-2 días hábiles</strong>.</>
              )}
              {orden.estado === "aceptada" && (
                <>
                  ¡Tu orden fue aceptada! Se generó un pedido de envío. Puedes seguirlo en la sección de pedidos.
                </>
              )}
              {orden.estado === "rechazada" && (
                <>
                  El distribuidor no pudo procesar tu orden. Puedes crear una nueva orden o contactar directamente.
                </>
              )}
              {orden.estado === "cancelada" && (
                <>
                  Has cancelado esta orden. Si fue un error, deberás agregar los productos al carrito nuevamente.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MisOrdenesCompraProps {
  ordenes: OrdenPedidoListItem[];
}

export default function MisOrdenesCompra({ ordenes }: MisOrdenesCompraProps) {
  const pendientes = ordenes.filter((o) => o.estado === "pendiente");
  const otras = ordenes.filter((o) => o.estado !== "pendiente");

  if (ordenes.length === 0) return null;

  return (
    <section className="px-4 mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag size={16} className="text-[var(--color-primary-500)]" />
        <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
          Órdenes de Compra
        </h2>
        {pendientes.length > 0 && (
          <span className="text-[10px] font-bold bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full">
            {pendientes.length} pendiente{pendientes.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {pendientes.map((o) => (
          <OrdenCard key={o.id} orden={o} />
        ))}
        {otras.map((o) => (
          <OrdenCard key={o.id} orden={o} />
        ))}
      </div>
    </section>
  );
}
