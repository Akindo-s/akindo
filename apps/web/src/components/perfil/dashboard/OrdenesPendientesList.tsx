import { Tarjeta } from "@/components/ui/Tarjeta";
import { Badge } from "@/components/ui/Badge";
import { Inbox, ChevronRight, Check } from "lucide-react";
import { obtenerOrdenesDistribuidor } from "@/lib/api/pedidos";
import Link from "next/link";

export function OrdenesPendientesSkeleton() {
    return (
        <section className="px-4 mb-8 animate-pulse">
            <div className="flex justify-between items-end mb-4">
                <div className="h-6 w-56 bg-stone-200 rounded" />
            </div>

            <div className="flex flex-col gap-3">
                <div className="h-[76px] bg-stone-200 rounded-2xl w-full" />
                <div className="h-[76px] bg-stone-200 rounded-2xl w-full" />
            </div>
        </section>
    );
}

export default async function OrdenesPendientesList() {
    
    const ordenes = await obtenerOrdenesDistribuidor("pendiente");

    if (!ordenes || ordenes.length === 0) {
        return null;
    }
    
    return (
        <section className="px-4 mb-8">
            <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-stone-900">Órdenes pendientes</h2>
                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">Requieren tu aprobación</p>
                </div>
                <Link href="/distribuidor/ordenes" className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 text-right leading-tight hover:underline">
                    gestionar<br />todas
                </Link>
            </div>

            <div className="flex flex-col gap-3">
                {ordenes.slice(0, 3).map((orden) => (
                    <Link key={orden.id} href={`/distribuidor/ordenes/${orden.id}`}>
                        <Tarjeta variante="calido" conPadding={false} className="p-3 flex items-center justify-between cursor-pointer hover:bg-white transition border-red-100 bg-red-50/30 relative">
                            <div className="flex gap-3 items-center">
                                <div className="relative w-10 h-10 rounded-full flex items-center justify-center  bg-[var(--color-primary-300)] text-[var(--color-primary-800)]">
                                    <span className="absolute -top-2 -left-2 bg-[var(--color-primary-300)] text-[var(--color-primary-800)] text-center w-6 h-6 rounded-full  ">{orden.paquetes.length}</span>
                                    
                                    <Inbox size={20} />
                                </div>
                                <div >
                                    <h4 className="font-bold text-sm text-stone-900">{orden.cliente_nombre || "Cliente Akindo"}</h4>
                                    
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="text-[10px] text-stone-500 font-medium">#{orden.id.substring(0, 8).toUpperCase()}</span>
                                        <div className="flex gap-1">

                                        {orden.pre_autorizado && (
                                            <Badge variante="exito" className="text-[8px] px-1 py-0 bg-green-50 text-green-600 border-green-100">
                                                Pre pagado
                                            </Badge>
                                        )}
                                        <Badge variante="advertencia" className="text-[9px] px-1.5 py-0.5">
                                            Pendiente
                                        </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-extrabold text-stone-900">
                                        ${orden.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-stone-400" />
                            </div>
                        </Tarjeta>
                    </Link>
                ))}
            </div>
        </section>
    );
}
