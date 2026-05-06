"use client";

import { Star, MessageSquare, Calendar, User, Package, ArrowUpRight, ExternalLink } from "lucide-react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import Link from "next/link";
import type { ValoracionResponse } from "@/lib/types/pedidos";
import { HeaderSticky } from "@/components/ui/HeaderSticky";


function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MENSAJES_FEEDBACK = [
  { threshold: 4.5, text: "¡Excelente! Tus clientes están encantados con tu servicio." },
  { threshold: 4.0, text: "Buen trabajo. Sigue brindando un gran servicio para mantener tu puntuación." },
  { threshold: 3.0, text: "Vas por buen camino, pero hay margen para mejorar la experiencia de tus clientes." },
  { threshold: 0.0, text: "Atención: Te recomendamos revisar los comentarios para mejorar la satisfacción de tus clientes." },
];

function getFeedbackMessage(promedio: number) {
  return MENSAJES_FEEDBACK.find(m => promedio >= m.threshold)?.text || "";
}

export default function ValoracionesDistribuidorView({ valoraciones }: { valoraciones: ValoracionResponse[] }) {
  const promedio = valoraciones.length > 0 
    ? (valoraciones.reduce((acc, v) => acc + v.puntuacion, 0) / valoraciones.length).toFixed(1)
    : 0;

  return (
    <div className="mx-auto w-full max-w-4xl pb-20">
      <HeaderSticky titulo="Mis Valoraciones" />
      
      <div className="px-4 pt-8 pb-6">
        <p className="text-sm text-stone-500 mt-1">Lo que tus clientes opinan de tu servicio.</p>
        
        {valoraciones.length > 0 && (
          <div className="mt-6 flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="text-center">
              <p className="text-3xl font-black text-amber-600">{promedio}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={12} 
                    className={s <= Number(promedio) ? "fill-amber-400 text-amber-400" : "text-stone-300"} 
                  />
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-amber-200" />
            <div>
              <p className="text-sm font-bold text-stone-800">{valoraciones.length} Valoraciones totales</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {getFeedbackMessage(Number(promedio))}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">
        {valoraciones.length === 0 ? (
          <Tarjeta className="text-center py-16">
            <MessageSquare size={48} className="text-stone-200 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Aún no has recibido valoraciones de tus clientes.</p>
          </Tarjeta>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {valoraciones.map((v) => (
              <Tarjeta key={v.id} className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={14} 
                        className={s <= v.puntuacion ? "fill-amber-400 text-amber-400" : "text-stone-200"} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-stone-400 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatFecha(v.created_at)}
                  </span>
                </div>

                {v.comentario ? (
                  <p className="text-sm text-stone-700 italic flex-1 mb-4">
                    "{v.comentario}"
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic flex-1 mb-4">
                    El cliente no dejó un comentario.
                  </p>
                )}

                <div className="pt-3 border-t border-stone-50 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
                      <User size={12} className="text-stone-400" />
                    </div>
                    <span className="text-[11px] font-bold text-stone-600">Cliente Akindo</span>
                  </div>
                  <Link 
                    href={`/pedidos/${v.pedido_id}`}
                    className="group text-[11px] text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-bold flex items-center gap-1.5 bg-[var(--color-primary-50)] hover:bg-[var(--color-primary-100)] px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <Package size={12} className="group-hover:rotate-12 transition-transform" />
                    Ver Pedido #{v.pedido_id.slice(0, 8).toUpperCase()}
                    <ExternalLink size={12} className="ml-0.5 opacity-70" />
                  </Link>
                </div>
              </Tarjeta>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
