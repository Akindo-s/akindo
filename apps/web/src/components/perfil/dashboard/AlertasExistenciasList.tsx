import { Tarjeta } from "@/components/ui/Tarjeta";
import { Badge } from "@/components/ui/Badge";
import { Image as ImageIcon } from "lucide-react";
import { obtenerProductosPocasExistencias } from "@/lib/api/distribuidor";
import ProductActionsMenu from "./ProductActionsMenu";

export function AlertasExistenciasSkeleton() {
    return (
        <section className="px-4 mb-8 animate-pulse">
            <div className="flex justify-between items-end mb-4">
                <div className="h-6 w-48 bg-stone-200 rounded" />
                <div className="h-4 w-12 bg-stone-200 rounded" />
            </div>

            <div className="flex flex-col gap-3">
                <div className="h-[60px] bg-stone-200 rounded-2xl w-full" />
                <div className="h-[80px] bg-stone-200 rounded-2xl w-full" />
                <div className="h-[80px] bg-stone-200 rounded-2xl w-full" />
            </div>
        </section>
    );
}

export default async function AlertasExistenciasList() {
    const productos = await obtenerProductosPocasExistencias();

    if (!productos || productos.length === 0) {
        return (
            <section className="px-4 mb-8">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Alertas de existencias</h2>
                <Tarjeta variante="calido" className="py-6 text-center">
                    <p className="text-sm text-stone-500">Todo en orden. No tienes productos con bajo stock.</p>
                </Tarjeta>
            </section>
        );
    }

    return (
        <section className="px-4 mb-8">
            
            <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-bold text-stone-900">Alertas de existencias</h2>
            </div>

            <div className="flex flex-col gap-3">
                {/* Banner resumen */}
                <Tarjeta variante="calido" className="py-3">
                    <h4 className="text-lg font-bold text-red-700">{productos.length} artículos</h4>
                    <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">UMBRAL DEL 67</p>
                </Tarjeta>

                {/* Lista de productos */}
                {productos.slice(0, 3).map((producto) => (
                    <Tarjeta key={producto.producto_id} variante="calido" conPadding={false} className="p-3 flex gap-3 items-center">
                        <div className="w-14 h-14 bg-[#DDA11E]/10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#DDA11E]/20">
                            {producto.imagen ? (
                                <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-yellow-800 opacity-50" size={24} />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-stone-900 leading-tight">{producto.nombre}</h4>
                            <p className="text-[10px] text-stone-500 mb-1">SKU: {producto.sku || 'N/A'}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-800">
                                    ${producto.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} / {producto.unidad}
                                </span>
                                <Badge variante={producto.existencias === 0 ? "error" : "advertencia"} className="text-[9px] px-1.5 py-0.5">
                                    {producto.existencias === 0 ? "Sin Stock" : `Bajo Stock (${producto.existencias})`}
                                </Badge>
                            </div>
                        </div>
                        <ProductActionsMenu productoId={producto.producto_id} />
                    </Tarjeta>
                ))}
            </div>
        </section>
    );
}
