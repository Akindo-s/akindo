"use client";

import { useState } from "react";
import { Check, X, Inbox, AlertCircle, FileText } from "lucide-react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import type { OrdenPedidoListItem, PedidoActionResult, OrdenPedidoResponse } from "@/lib/types/pedidos";
import { HeaderSticky } from "@/components/ui/HeaderSticky";
import Link from "next/link";

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

function RechazarModal({
  orden,
  onClose,
  onConfirm,
  loading
}: {
  orden: OrdenPedidoListItem;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  loading: boolean;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <Tarjeta className="w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-stone-900 mb-2">Rechazar orden de compra</h3>
        <p className="text-sm text-stone-500 mb-4">
          Estás a punto de rechazar la orden de <strong>{orden.cliente_nombre}</strong>. 
          Por favor, indica un motivo (opcional pero recomendado):
        </p>
        
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Sin stock suficiente..."
          className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm mb-6 min-h-[100px] resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
        />

        <div className="flex gap-3">
          <Boton variante="secundario" onClick={onClose} className="!w-full">
            Cancelar
          </Boton>
          <Boton 
            variante="peligro" 
            onClick={() => onConfirm(motivo)} 
            loading={loading}
            className="!w-full bg-red-600 text-white hover:bg-red-700 border-none"
          >
            Confirmar rechazo
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = ["Pendientes", "Aceptadas", "Rechazadas"] as const;
type Tab = (typeof TABS)[number];

interface OrdenesCompraViewProps {
  pendientes: OrdenPedidoListItem[];
  aceptadas: OrdenPedidoListItem[];
  rechazadas: OrdenPedidoListItem[];
  aceptarAction: (id: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
  rechazarAction: (id: string, motivo?: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

export default function OrdenesCompraView({
  pendientes: pendientesInit,
  aceptadas: aceptadasInit,
  rechazadas: rechazadasInit,
  aceptarAction,
  rechazarAction,
}: OrdenesCompraViewProps) {
  const [tab, setTab] = useState<Tab>("Pendientes");
  
  // Estado local para UI optimista o recargas manuales
  const [pendientes, setPendientes] = useState(pendientesInit);
  const [aceptadas, setAceptadas] = useState(aceptadasInit);
  const [rechazadas, setRechazadas] = useState(rechazadasInit);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ordenARechazar, setOrdenARechazar] = useState<OrdenPedidoListItem | null>(null);

  const mostradas = tab === "Pendientes" ? pendientes : tab === "Aceptadas" ? aceptadas : rechazadas;

  const handleAceptar = async (orden: OrdenPedidoListItem) => {
    setLoadingId(orden.id);
    const res = await aceptarAction(orden.id);
    setLoadingId(null);
    if (!res.ok) {
      setError(res.error ?? "No se pudo aceptar la orden");
      return;
    }
    // Mover a aceptadas localmente
    setPendientes(p => p.filter(x => x.id !== orden.id));
    setAceptadas(a => [{...orden, estado: "aceptada"}, ...a]);
  };

  const handleRechazar = async (motivo: string) => {
    if (!ordenARechazar) return;
    setLoadingId(ordenARechazar.id);
    const res = await rechazarAction(ordenARechazar.id, motivo);
    setLoadingId(null);
    setOrdenARechazar(null);
    
    if (!res.ok) {
      setError(res.error ?? "No se pudo rechazar la orden");
      return;
    }
    // Mover a rechazadas localmente
    setPendientes(p => p.filter(x => x.id !== ordenARechazar.id));
    setRechazadas(r => [{...ordenARechazar, estado: "rechazada"}, ...r]);
  };

  return (
    <section className="mx-auto w-full max-w-5xl pb-20">
      <HeaderSticky titulo="Órdenes de Compra" />
      
      <div className="px-4 pt-8">
        <p className="text-sm text-stone-500 mt-1">
          Las órdenes son propuestas de clientes. Al aceptarlas, se confirma el pago y se convierten en Pedidos.
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-stone-200 pb-2 overflow-x-auto no-scrollbar">
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
            {t === "Pendientes" && pendientes.length > 0 && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold
                ${tab === t ? "bg-red-500 text-white" : "bg-red-100 text-red-600"}`}>
                {pendientes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mostradas.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <Inbox size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500 font-medium">No hay órdenes {tab.toLowerCase()}</p>
          </div>
        ) : (
          mostradas.map((orden) => (
            <Tarjeta key={orden.id} className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 tracking-wider uppercase">
                      Orden #{orden.id.slice(0, 8)}
                    </p>
                    <p className="text-sm font-bold text-stone-900 mt-0.5">{orden.cliente_nombre}</p>
                  </div>
                  {orden.pre_autorizado && tab === "Pendientes" && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md uppercase tracking-wide">
                      Pre-pago
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-stone-500 space-y-1.5 mb-4">
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span className="font-medium text-stone-800">{formatFecha(orden.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-100 mt-2">
                    <span className="font-semibold">Total a cobrar:</span>
                    <span className="text-base font-extrabold text-[var(--color-primary-600)]">
                      ${formatMoney(orden.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4">
                <Link href={`/distribuidor/ordenes/${orden.id}`} className="flex-1">
                  <Boton 
                    variante="secundario" 
                    className="w-full !py-2.5 !text-xs"
                    Icono={FileText}
                  >
                    Detalle
                  </Boton>
                </Link>
                {tab === "Pendientes" && (
                  <>
                    <Boton
                      variante="chip"
                      className="flex-1 justify-center bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      onClick={() => setOrdenARechazar(orden)}
                      disabled={loadingId !== null}
                      Icono={X}
                    >
                      Rechazar
                    </Boton>
                    <Boton
                      variante="primario"
                      className="flex-1 !py-2.5 !text-xs shadow-none"
                      onClick={() => handleAceptar(orden)}
                      loading={loadingId === orden.id}
                      Icono={Check}
                    >
                      Aceptar
                    </Boton>
                  </>
                )}
              </div>
            </Tarjeta>
          ))
        )}
      </div>

      {ordenARechazar && (
        <RechazarModal 
          orden={ordenARechazar}
          onClose={() => setOrdenARechazar(null)}
          onConfirm={handleRechazar}
          loading={loadingId === ordenARechazar.id}
        />
      )}

      {error && <VentanaEmergente mensaje={error} onClose={() => setError(null)} />}
    </section>
  );
}
