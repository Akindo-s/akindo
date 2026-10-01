import { sesionRequerida } from "@/lib/sesion";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Administración",
    description: "Gestión de categorías de productos y distribuidores",
};

export default async function CategoriasLayout({ children }: { children: React.ReactNode }) {
    await sesionRequerida('admin');
    return <>{children}</>;
}
