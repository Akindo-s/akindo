import { Suspense } from "react";
import Tienda from "@akindo/ui/screens/tienda";
import { actualizarImagenNegocio } from "@/lib/api/distribuidor";
import { actualizarImagenPerfil, actualizarPerfilDistribuidor, esDistribuidorDueno } from "@/lib/api/usuario";

export default async function TiendaPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const distribuidorId = typeof sp.d === "string" ? sp.d : null;

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen bg-[#FAF5EE]">
                    <div className="w-8 h-8 border-2 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <Tienda
                distribuidorId={distribuidorId}
                esDistribuidorDueno={esDistribuidorDueno}
                actualizarImagenNegocio={actualizarImagenNegocio}
                actualizarImagenPerfil={actualizarImagenPerfil}
                actualizarPerfilDistribuidor={actualizarPerfilDistribuidor}
            />
        </Suspense>
    );
}
