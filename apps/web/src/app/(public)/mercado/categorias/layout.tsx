import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Categorías",
    description: "Navega por las categorías de productos y distribuidores",
};

export default function CategoriasLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
