import Link from "next/link";
import { ChevronRight, Grid3X3, Package } from "lucide-react";
import { MercadoBuscador } from "@/components/mercado/MercadoBuscador";
import { listarProductosCatalogo } from "@/lib/api/productos";
import { TarjetaProductoCatalogo } from "@/components/mercado/TarjetaProductoCatalogo";
import { StorefrontIcon } from "@/components/icons/NavigationIcons";

export const metadata = {
    title: "Mercado",
    description: "Explora categorías, distribuidores y productos en el mercado de Akindo.",
};

const SECCIONES = [
    {
        href: "/mercado/categorias",
        label: "Explorar categorías",
        descripcion: "Navega por todas las categorías de productos y distribuidores",
        Icon: Grid3X3,
        color: "from-amber-50 to-amber-100 border-amber-200",
        iconColor: "text-amber-600 bg-amber-100",
    },
    {
        href: "/mercado/distribuidores",
        label: "Explorar distribuidores",
        descripcion: "Encuentra proveedores verificados para tu negocio",
        Icon: StorefrontIcon,
        color: "from-stone-50 to-stone-100 border-stone-200",
        iconColor: "text-stone-600 bg-stone-100",
    },
    {
        href: "/mercado/productos",
        label: "Explorar productos",
        descripcion: "Busca entre miles de productos mayoristas",
        Icon: Package,
        color: "from-orange-50 to-orange-100 border-orange-200",
        iconColor: "text-orange-600 bg-orange-100",
    },
];

export default async function MercadoPage() {
    // Recomendaciones: primeros 8 productos del catálogo global (sustituto temporal)
    const catalogo = await listarProductosCatalogo(1, 8);
    const recomendaciones = catalogo.productos;

    return (
        <div className="flex flex-col gap-6 px-4 md:px-6 py-5 w-full max-w-2xl lg:max-w-5xl mx-auto">
            {/* Título */}
            <h1 className="text-lg font-bold text-[var(--color-neutral-900)]">
                El{" "}
                <span className="text-[var(--color-primary-500)]">Mercadorito lico</span>
            </h1>

            {/* Buscador */}
            <MercadoBuscador />

            {/* Secciones de exploración */}
            <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
                    Explorar
                </h2>
                <div className="flex flex-col md:grid md:grid-cols-3 gap-3">
                    {SECCIONES.map(({ href, label, descripcion, Icon, color, iconColor }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`group flex items-center gap-3 p-4 rounded-2xl border bg-gradient-to-br ${color} hover:shadow-md transition-all active:scale-[0.98]`}
                        >
                            <div className={`p-2.5 rounded-xl ${iconColor} flex-shrink-0`}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-stone-900 leading-snug">
                                    {label}
                                </p>
                                <p className="text-xs text-stone-500 leading-snug mt-0.5 line-clamp-2">
                                    {descripcion}
                                </p>
                            </div>
                            <ChevronRight
                                size={16}
                                className="text-stone-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                            />
                        </Link>
                    ))}
                </div>
            </section>

            {/* Recomendaciones */}
            {recomendaciones.length > 0 && (
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-[var(--color-neutral-900)]">
                            Productos que podrían interesarte
                        </h2>
                        <Link
                            href="/mercado/productos"
                            className="text-xs font-medium text-[var(--color-primary-500)] hover:underline transition select-none"
                        >
                            Ver todos →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {recomendaciones.map((p) => (
                            <TarjetaProductoCatalogo
                                key={p.producto_id}
                                productoId={p.producto_id}
                                nombre={p.nombre}
                                costo={p.costo}
                                unidad={p.unidad}
                                imagen={p.imagen}
                                disponible={p.disponible}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
