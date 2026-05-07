"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, MessageCircle, MapPin, Package2, CheckCircle2, BadgeCheck, MessageSquare } from "lucide-react";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { PedidoResponse, PedidoActionResult } from "@/lib/types/pedidos";
import Link from "next/link";
import { ResumenFinancieroPedido } from "./ResumenFinancieroPedido";
import { ListaProductosPedido } from "./ListaProductosPedido";
import { HistorialActualizacionesPedido } from "./HistorialActualizacionesPedido";

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

function ValoracionForm({ onSubmit, loading }: { onSubmit: (p: number, c: string) => void, loading: boolean }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");

  return (
    <Tarjeta variante="calido" className="mb-6">
      <h3 className="text-sm font-bold text-stone-900 text-center mb-2">¡Califica tu experiencia!</h3>
      <p className="text-xs text-stone-500 text-center mb-4">Tu opinión ayuda al distribuidor y a otros compradores.</p>
      
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setPuntuacion(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              size={32}
              className={`${star <= puntuacion ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`}
            />
          </button>
        ))}
      </div>

      {puntuacion > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <MessageCircle size={16} className="absolute left-3 top-3 text-stone-400" />
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Qué te pareció el pedido?"
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] min-h-[80px] resize-none"
            />
          </div>
          <Boton
            variante="primario"
            className="!w-full !py-2.5"
            onClick={() => onSubmit(puntuacion, comentario)}
            loading={loading}
          >
            Enviar valoración
          </Boton>
        </div>
      )}
    </Tarjeta>
  );
}

export default function DetallePedidoView({
  pedido: pedidoInicial,
  valorarAction,
}: {
  pedido: PedidoResponse;
  valorarAction: (p: number, c?: string) => Promise<PedidoActionResult>;
}) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [loadingVal, setLoadingVal] = useState(false);

  const handleValorar = async (puntuacion: number, comentario: string) => {
    setLoadingVal(true);
    const result = await valorarAction(puntuacion, comentario);
    setLoadingVal(false);
    if (result.ok) {
      setPedido({ ...pedido, tiene_valoracion: true });
    }
  };

  const ordenesLineaTiempo = ["pendiente de envio", "en envio", "entregado", "cancelado"];
  const timelineActual = ordenesLineaTiempo.indexOf(pedido.estado);

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col pb-20">
      <EncabezadoPagina titulo={`Pedido #${pedido.id.slice(0, 8)}`} href="/pedidos" />
      
      <div className="px-4 pt-4 space-y-6">

        {/* Timeline */}
        {pedido.estado !== "cancelado" && (
          <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
            <div className="relative flex justify-between">
              {/* Línea conectora */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-100 z-0" />
              <div 
                className="absolute top-4 left-4 h-0.5 bg-[var(--color-primary-500)] z-0 transition-all duration-500" 
                style={{ width: `${(timelineActual / 2) * 100}%` }}
              />

              {/* Nodos */}
              {[
                { label: "Preparando", step: 0 },
                { label: "En camino", step: 1 },
                { label: "Entregado", step: 2 },
              ].map((item) => {
                const isPast = timelineActual >= item.step;
                const isCurrent = timelineActual === item.step;
                return (
                  <div key={item.step} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isPast 
                        ? "bg-[var(--color-primary-500)] border-[var(--color-primary-500)] text-white" 
                        : "bg-white border-stone-200 text-stone-300"}`}
                    >
                      {isPast ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-stone-200" />}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider
                      ${isCurrent ? "text-[var(--color-primary-600)]" : isPast ? "text-stone-800" : "text-stone-400"}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Valoración (Si está entregado y no ha valorado) */}
        {pedido.estado === "entregado" && !pedido.tiene_valoracion && (
          <ValoracionForm onSubmit={handleValorar} loading={loadingVal} />
        )}

        {/* Distribuidor / Cliente info */}
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Vendido por</p>
          <Link href={`/mercado/distribuidor/tienda?d=${pedido.distribuidor_id}`}>
          <Tarjeta conPadding={false} className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center text-amber-700 font-bold flex-shrink-0">
                {pedido.distribuidor_imagen ? (
                  <img
                  src={pedido.distribuidor_imagen}
                  alt={pedido.distribuidor_nombre ?? "Distribuidor"}
                  width={44}
                  height={44}
                  className="object-cover w-full h-full"
                  />
                ) : (
                  <span>{pedido.distribuidor_nombre?.charAt(0) ?? "D"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-stone-900 truncate">{pedido.distribuidor_nombre}</p>
                  {pedido.distribuidor_verificado && (
                    <BadgeCheck size={15} className="text-[var(--color-primary-500)] flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  {pedido.distribuidor_verificado ? "Distribuidor verificado" : "Distribuidor"}
                </p>
              </div>
            </div>
          </Tarjeta>
          </Link>
        </div>

        {/* Lista de productos unificada */}
        <ListaProductosPedido 
          productos={pedido.paquetes} 
          conLinks={true} 
        />

        {/* Historial de actualizaciones unificado */}
        <HistorialActualizacionesPedido 
          actualizaciones={pedido.actualizaciones} 
          titulo="Historial del pedido"
        />

        {/* Valoración del cliente */}
        {pedido.valoracion && (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Valoración del pedido</p>
            <Tarjeta className="!bg-stone-50 border-stone-200">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={s <= pedido.valoracion!.puntuacion ? "fill-amber-400 text-amber-400" : "text-stone-300"}
                  />
                ))}
              </div>
              {pedido.valoracion.comentario && (
                <div className="flex gap-2">
                  <MessageSquare size={14} className="text-stone-400 mt-1 flex-shrink-0" />
                  <p className="text-sm text-stone-700 italic">
                    "{pedido.valoracion.comentario}"
                  </p>
                </div>
              )}
              <p className="text-[10px] text-stone-400 mt-3 font-medium">
                Publicada el {formatFecha(pedido.valoracion.created_at)}
              </p>
            </Tarjeta>
          </div>
        )}

      </div>
    </section>
  );
}
