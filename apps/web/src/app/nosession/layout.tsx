import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inicia sesión",
    description: "Necesitas una cuenta de Akindo para continuar.",
};

export default function NoSessionLayout({ children }: { children: React.ReactNode }) {
    return children;
}
