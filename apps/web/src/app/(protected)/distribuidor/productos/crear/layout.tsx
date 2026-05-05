import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Crear Producto",
    description: "Registrar un nuevo producto en el catálogo",
};

export default function CrearProductoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
