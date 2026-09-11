
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
    // El body ya no scrollea: el scroll de la página va en este <main>.
    return <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>;
}
