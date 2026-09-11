import { Suspense } from "react";
import ProductoDetalle from "@akindo/ui/screens/producto-detalle";
import { verificarProductoEnCarrito } from "@/lib/api/carrito";

export default async function ProductoDetallePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const productoId = typeof sp.p === "string" ? sp.p : null;

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#FAF5EE]">
                <div className="w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ProductoDetalle productoId={productoId} verificarEnCarrito={verificarProductoEnCarrito} />
        </Suspense>
    );
}
