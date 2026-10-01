import { sesionRequerida } from "@/lib/sesion";

export default async function OrdenesDistribuidorLayout({ children }: { children: React.ReactNode }) {
    await sesionRequerida('distribuidor');
    return <>{children}</>;
}
