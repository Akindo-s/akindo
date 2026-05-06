"use client";

import { Tarjeta } from "@/components/ui/Tarjeta";
import { Info } from "lucide-react";

interface ResumenFinancieroProps {
  total: number;
  comision?: number;
  esDistribuidor?: boolean;
  moneda?: string;
}

export function ResumenFinancieroPedido({
  total,
  comision = 0,
  esDistribuidor = false,
  moneda = "MXN"
}: ResumenFinancieroProps) {
  const formatMoney = (v: number) => 
    v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Para el cliente: total es lo que pagó.
  // Para el distribuidor: total es su ganancia neta. Venta bruta = total + comision.
  const ventaBruta = total + comision;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
        {esDistribuidor ? "Resumen Financiero" : "Resumen del Pago"}
      </p>
      
      <Tarjeta className={`overflow-hidden transition-all duration-300 ${esDistribuidor ? "bg-stone-50 border-stone-200" : "bg-amber-50/50 border-amber-100"}`}>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-stone-500 font-medium">{esDistribuidor ? "Venta bruta" : "Subtotal"}</span>
            <span className="font-bold text-stone-700">${formatMoney(ventaBruta)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">
                {esDistribuidor ? "Comisión de servicio" : "Costo de envío e impuestos"}
              </span>
              {esDistribuidor && (
                <div className="group relative">
                  <Info size={12} className="text-stone-300 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    Esta comisión se descuenta automáticamente por el uso de la plataforma.
                  </div>
                </div>
              )}
            </div>
            <span className={`font-bold ${esDistribuidor ? "text-red-500" : "text-stone-700"}`}>
              {esDistribuidor ? "-" : ""}${formatMoney(comision)}
            </span>
          </div>

          <div className={`pt-3 border-t ${esDistribuidor ? "border-stone-200" : "border-amber-200"} flex justify-between items-end`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${esDistribuidor ? "text-stone-400" : "text-amber-600"}`}>
                {esDistribuidor ? "Ganancia Neta" : "Total Pagado"}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${esDistribuidor ? "text-stone-900" : "text-amber-700"}`}>
                  ${formatMoney(total)}
                </span>
                <span className="text-[10px] font-bold text-stone-400 uppercase">{moneda}</span>
              </div>
            </div>
            
            {!esDistribuidor && (
              <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm border border-amber-200">
                Pagado
              </div>
            )}
          </div>
        </div>
      </Tarjeta>
    </div>
  );
}
