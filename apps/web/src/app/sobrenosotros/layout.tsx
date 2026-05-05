import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sobre Nosotros",
    description: "Langing page de akindo (sin terminar jaja salu2)"
};

export default function SobreNosotrosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
