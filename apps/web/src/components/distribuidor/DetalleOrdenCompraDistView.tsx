"use client";

import { useState } from "react";
import { 
  Check, 
  X, 
  Inbox, 
  Calendar, 
  User, 
  CreditCard, 
  Info,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { HeaderSticky } from "@/components/ui/HeaderSticky";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Badge } from "@/components/ui/Badge";
import { ListaProductosPedido } from "@/components/pedidos/ListaProductosPedido";
import { ResumenFinancieroPedido } from "@/components/pedidos/ResumenFinancieroPedido";
import { VentanaEmergente } from "@/components/VentanaEmergente";
import type { OrdenPedidoResponse, PedidoActionResult } from "@/lib/types/pedidos";
import { useRouter } from "next/navigation";

interface DetalleOrdenCompraDistViewProps {
  orden: OrdenPedidoResponse;
  aceptarAction: (id: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
  rechazarAction: (id: string, motivo?: string) => Promise<PedidoActionResult<OrdenPedidoResponse>>;
}

export default function DetalleOrdenCompraDistView({
  orden,
  aceptarAction,
  rechazarAction,
}: DetalleOrdenCompraDistViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const formatMoney = (v: number) => 
    v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatFecha = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const handleAceptar = async () => {
    setLoading(true);
    const res = await aceptarAction(orden.id);
    setLoading(false);
    if (res.ok) {
      router.refresh();
      // Si era pre-autorizado, se convirtió en pedido. Podríamos redirigir.
      if (orden.pre_autorizado) {
        router.push("/distribuidor/pedidos");
      }
    } else {
      setError(res.error ?? "No se pudo aceptar la orden");
    }
  };

  const handleRechazar = async () => {
    setLoading(true);
    const res = await rechazarAction(orden.id, motivoRechazo);
    setLoading(false);
    if (res.ok) {
      setShowRechazarModal(false);
      router.refresh();
    } else {
      setError(res.error ?? "No se pudo rechazar la orden");
    }
  };

  const isPendiente = orden.estado === "pendiente";
  
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] pb-24">
      <HeaderSticky titulo={`Orden #${orden.id.slice(0, 8)}`} />

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Estado y Acciones Rápidas */}
        <Tarjeta className="relative overflow-hidden border-stone-200/60 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Estado de la Orden</p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variante={
                      orden.estado === "pendiente" ? "advertencia" : 
                      orden.estado === "aceptada" ? "exito" : "error"
                    }
                    className="capitalize text-xs font-bold px-3 py-1"
                  >
                    {orden.estado}
                  </Badge>
                  {orden.pre_autorizado && (
                    <Badge variante="exito" className="bg-green-50 text-green-700 border-green-200 text-[10px] uppercase font-black">
                      Pre-pago Autorizado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Total</p>
                <p className="text-2xl font-black text-[var(--color-primary-600)]">${formatMoney(orden.total)}</p>
              </div>
            </div>

            {isPendiente && (
              <div className="flex gap-3 pt-2">
                <Boton 
                  variante="chip" 
                  className="flex-1 bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                  onClick={() => setShowRechazarModal(true)}
                  disabled={loading}
                >
                  <X size={16} className="mr-2" />
                  Rechazar
                </Boton>
                <Boton 
                  variante="primario" 
                  className="flex-1 shadow-lg shadow-[var(--color-primary-200)]"
                  onClick={handleAceptar}
                  loading={loading}
                >
                  <Check size={16} className="mr-2" />
                  Aceptar Orden
                </Boton>
              </div>
            )}
          </div>
        </Tarjeta>

        {/* Información del Cliente */}
        <section className="space-y-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Información del Cliente</p>
          <Tarjeta className="flex items-center gap-4 border-stone-200/60 p-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-600)] flex items-center justify-center shrink-0 overflow-hidden border border-stone-200">
              {orden.cliente_imagen ? (
                <img src={orden.cliente_imagen} alt={orden.cliente_nombre ?? ""} className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{orden.cliente_nombre || "Cliente Akindo"}</p>
              <p className="text-xs text-stone-500 truncate">{orden.cliente_email || "Sin email registrado"}</p>
              <p className="text-[10px] text-stone-400 mt-0.5 italic">Recibida el {formatFecha(orden.created_at)}</p>
            </div>
          </Tarjeta>
        </section>

        {/* Resumen Financiero */}
        <ResumenFinancieroPedido 
          total={orden.total} 
          comision={0}
          esDistribuidor={true} 
        />

        {orden.pre_autorizado && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
            <Info size={16} className="text-green-600 shrink-0" />
            <p className="text-[10px] text-green-700 font-medium leading-tight">
              Esta orden tiene un **pago pre-autorizado**. Al aceptarla, el cobro se procesará automáticamente y se generará el pedido de envío.
            </p>
          </div>
        )}

        {/* Productos */}
        <ListaProductosPedido 
          productos={orden.paquetes} 
          titulo="Productos en la Orden" 
          vistaDistribuidor={true}
          conLinks
        />

        {/* Ayuda/Soporte */}
        <div className="pt-4">
          <div className="p-4 rounded-2xl bg-stone-100/50 border border-stone-200/40 text-center">
            <AlertCircle size={20} className="mx-auto text-stone-400 mb-2" />
            <p className="text-xs text-stone-500 max-w-[280px] mx-auto leading-relaxed">
              ¿Tienes problemas con esta orden? Contacta a soporte Akindo para asistencia con inventario o pagos.
            </p>
          </div>
        </div>

      </main>

      {/* Modal de Rechazo */}
      {showRechazarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <Tarjeta className="w-full max-w-md shadow-2xl scale-in-center">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Rechazar orden de compra</h3>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              Indica el motivo por el cual no puedes procesar esta orden. Se le notificará al cliente.
            </p>
            
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej: No contamos con stock suficiente de uno de los artículos..."
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm mb-6 min-h-[120px] resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
            />

            <div className="flex gap-3">
              <Boton 
                variante="secundario" 
                onClick={() => setShowRechazarModal(false)} 
                className="flex-1 bg-white"
                disabled={loading}
              >
                Cancelar
              </Boton>
              <Boton 
                variante="peligro" 
                onClick={handleRechazar} 
                loading={loading}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 border-none"
              >
                Confirmar
              </Boton>
            </div>
          </Tarjeta>
        </div>
      )}

      {error && <VentanaEmergente mensaje={error} onClose={() => setError(null)} />}
    </div>
  );
}
