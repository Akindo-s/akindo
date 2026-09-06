import { CategoriasProvider } from "@akindo/shared/categorias-context";
import { cargarCategorias } from "@/lib/providers-data";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Productos",
    description: "Explora el catálogo de productos mayoristas",
};

export default function ProductosLayout({ children }: { children: React.ReactNode }) {
    return <CategoriasProvider cargarCategorias={cargarCategorias}>{children}</CategoriasProvider>;
}
