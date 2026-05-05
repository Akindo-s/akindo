import { Suspense } from "react";
import { ProductoDetalle } from "@/components/mercado/ProductoDetalle";

export default async function ProductoDetallePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const productoId = typeof sp.p === "string" ? sp.p : null;

    if (!productoId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 bg-[#FAF5EE]">
                <p className="text-stone-500 text-sm font-medium mb-4">No se especificó un producto.</p>
                <a href="/mercado/productos" className="text-sm font-medium text-[var(--color-primary-600)] bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
                    Volver al catálogo
                </a>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#FAF5EE]">
                <div className="w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ProductoDetalle productoId={productoId} />
        </Suspense>
    );
}
