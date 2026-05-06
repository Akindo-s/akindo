"use client";

import { Package2 } from "lucide-react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import type { PedidoItemResponse } from "@/lib/types/pedidos";
import Link from "next/link";

interface ListaProductosPedidoProps {
  productos: PedidoItemResponse[];
  titulo?: string;
  conLinks?: boolean;
  vistaDistribuidor?:boolean;
}

export function ListaProductosPedido({
  productos,
  titulo = "Productos",
  conLinks = false,
  vistaDistribuidor=false
}: ListaProductosPedidoProps) {
  const formatMoney = (v: number) => 
    v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{titulo}</p>
      <Tarjeta conPadding={false} className="divide-y divide-stone-100 overflow-hidden">
        {productos.map((prod) => {
          const content = (
            <div className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                {prod.imagen_producto ? (
                  <img src={prod.imagen_producto} alt={prod.nombre_producto ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Package2 size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900 truncate">
                  {prod.nombre_producto || prod.medida_snapshot.nombre}
                </p>
                <p className="text-xs text-stone-500">
                  {prod.cantidad} {prod.medida_snapshot.unidad} × ${formatMoney(prod.costo_unitario)}
                </p>
              </div>
              <p className="text-sm font-black text-stone-900">${formatMoney(prod.subtotal)}</p>
            </div>
          );

          if (conLinks) {
            return (
              <Link key={`link-${prod.producto_id}`} href={`/mercado/productos/detalle?p=${prod.producto_id}`}>
                {content}
              </Link>
            );
          }

          return <div key={prod.producto_id}>{content}</div>;
        })}
      </Tarjeta>
    </div>
  );
}
