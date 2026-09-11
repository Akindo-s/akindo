import { Suspense } from "react";
import Categorias from "@akindo/ui/screens/categorias";
import { cargarCategorias } from "@/lib/providers-data";

export const dynamic = "force-dynamic";

export default function CategoriasPageWrapper() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" /></div>}>
            <Categorias cargarCategorias={cargarCategorias} />
        </Suspense>
    );
}
