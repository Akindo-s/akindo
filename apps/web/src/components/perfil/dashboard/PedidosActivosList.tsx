import { Tarjeta } from "@/components/ui/Tarjeta";
import { Badge } from "@/components/ui/Badge";
import { Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { obtenerPedidosActivos } from "@/lib/api/distribuidor";
import Link from "next/link";

export function PedidosActivosSkeleton() {
    return (
        <section className="px-4 mb-8 animate-pulse">
            <div className="flex justify-between items-end mb-4">
                <div className="h-6 w-48 bg-stone-200 rounded" />
            </div>

            <div className="flex flex-col gap-3">
                <div className="h-[76px] bg-stone-200 rounded-2xl w-full" />
                <div className="h-[76px] bg-stone-200 rounded-2xl w-full" />
            </div>
        </section>
    );
}

export default async function PedidosActivosList() {
    const todosLosPedidos = await obtenerPedidosActivos();

    // Filtramos para asegurar que SOLO se muestren los que NO están finalizados
    const pedidos = todosLosPedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado');

    if (!pedidos || pedidos.length === 0) {
        return (
            <section className="px-4 mb-8">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Pedidos activos</h2>
                <Tarjeta variante="calido" className="py-6 text-center">
                    <p className="text-sm text-stone-500 mb-2">No tienes pedidos activos, ¡da click aquí para averiguar cómo vender mejor!</p>
                    <a 
                        href="https://www.youtube.com/watch?v=a40r8AhnPm8&t=2s" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block text-xs font-bold text-[#DDA11E] underline hover:text-yellow-700 transition"
                    >
                        Descubrir el secreto
                    </a>
                </Tarjeta>
            </section>
        );
    }

    return (
        <section className="px-4 mb-8">
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-bold text-stone-900">Pedidos activos</h2>
                <button className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1 text-right leading-tight hover:underline">
                    VER<br />TODO
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {/* Lista de pedidos */}
                {pedidos.slice(0, 3).map((pedido) => {
                    const esPendiente = pedido.estado === 'pendiente de envio' || pedido.estado === 'pendiente';
                    const esEnEnvio = pedido.estado === 'en envio';
                    
                    return (
                        <Link key={pedido.pedido_id} href={`/pedidos/${pedido.pedido_id}`}>
                            <Tarjeta variante="calido" conPadding={false} className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#FDF2E3] transition">
                                <div className="flex gap-3 items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        esPendiente ? 'bg-orange-100 text-orange-600' : 
                                        esEnEnvio ? 'bg-blue-100 text-blue-600' :
                                        'bg-stone-100 text-stone-600'
                                    }`}>
                                        {esPendiente ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-stone-900">{pedido.cliente_nombre}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-stone-500 font-medium">#{pedido.orden_id.substring(0, 8).toUpperCase()}</span>
                                            <Badge variante={esPendiente ? 'advertencia' : esEnEnvio ? 'neutro' : 'exito'} className="text-[9px] px-1.5 py-0.5 capitalize">
                                                {pedido.estado === 'pendiente de envio' ? 'Pendiente' : pedido.estado}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-stone-900">
                                            ${pedido.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-stone-400" />
                                </div>
                            </Tarjeta>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
