import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Administración",
    description: "Gestión de categorías de productos y distribuidores",
};

export default function CategoriasLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
