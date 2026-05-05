import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Catálogo",
    description: "Catálogo completo de productos",
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
