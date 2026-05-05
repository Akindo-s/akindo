import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mis Productos",
    description: "Gestión de inventario y productos",
};

export default function ProductosDistribuidorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
