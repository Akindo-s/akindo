import { Suspense } from "react";
import Productos from "@akindo/ui/screens/productos";

// El CategoriasProvider de los chips lo pone productos/layout.tsx.
export default function ProductosPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" /></div>}>
            <Productos />
        </Suspense>
    );
}
