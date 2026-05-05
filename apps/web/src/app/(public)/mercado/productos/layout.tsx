import { CategoriasProvider } from "@/lib/categorias-context";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Productos",
    description: "Explora el catálogo de productos mayoristas",
};

export default function ProductosLayout({ children }: { children: React.ReactNode }) {
    return <CategoriasProvider>{children}</CategoriasProvider>;
}
