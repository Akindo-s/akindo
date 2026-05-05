import { Tarjeta } from "@/components/ui/Tarjeta";
import { obtenerResumenMensual } from "@/lib/api/distribuidor";

export function ResumenStatsSkeleton() {
    return (
        <section className="px-4 flex flex-col gap-3 mb-6 animate-pulse">
            <div className="h-[120px] bg-stone-200 rounded-2xl w-full" />
            <div className="flex gap-3">
                <div className="flex-1 h-[100px] bg-stone-200 rounded-2xl" />
                <div className="flex-1 h-[100px] bg-stone-200 rounded-2xl" />
            </div>
        </section>
    );
}

export default async function ResumenStats() {
    // Simulamos un poco de retraso en dev si es necesario, o dejamos que el fetch natural demore
    const resumen = await obtenerResumenMensual();

    // Valores por defecto en caso de error o datos faltantes
    const volumen = resumen?.volumen_bruto_mes || 0;
    const pedidos = resumen?.pedidos_activos || 0;
    const pocoStock = resumen?.productos_poco_stock || 0;

    return (
        <section className="px-4 flex flex-col gap-3 mb-6">
            {/* Tarjeta grande — Volumen Bruto */}
            <Tarjeta variante="calido" className="relative overflow-hidden">
                <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2">VOLUMEN BRUTO</p>
                <h3 className="text-4xl font-bold text-stone-900 mb-2">
                    ${volumen.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                
                {/* 
                
                <p className="text-[10px] font-bold text-yellow-700 flex items-center gap-1">
                    <span>↑</span> 12 % respecto a la semana pasada
                </p>
                

                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-24 opacity-60 pointer-events-none">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                        <path d="M0,35 Q10,35 20,40 T40,25 T60,20 T80,10 T100,5" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <div className="flex justify-between w-full px-2 mt-1 text-[8px] text-stone-400 font-bold">
                        <span>MON</span><span>WED</span><span>SUN</span>
                    </div>
                </div>
                    */}
            </Tarjeta>

            {/* Tarjetas pequeñas */}
            <div className="flex gap-3">
                <Tarjeta variante="calido" className="flex-1 flex flex-col justify-between min-h-[100px] min-w-0">
                    <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2 leading-tight break-words">ACTIVOS<br />PEDIDOS</p>
                    <h3 className="text-2xl font-bold text-stone-900 truncate">{pedidos}</h3>
                </Tarjeta>
                <Tarjeta variante="calido" className="flex-1 flex flex-col justify-between min-h-[100px] min-w-0">
                    <p className="text-[10px] font-bold text-stone-600 tracking-wider mb-2 leading-tight break-words">POCO<br />STOCK</p>
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-red-700 truncate">{pocoStock} art.</h3>
                        <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-0.5 truncate">UMBRAL DEL 67</p>
                    </div>
                </Tarjeta>
            </div>
        </section>
    );
}
