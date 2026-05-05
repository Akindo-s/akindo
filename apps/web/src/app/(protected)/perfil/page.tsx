import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PerfilCliente from "@/components/perfil/PerfilCliente";
import { obtenerInformacionPerfil, obtenerPerfilDistribuidor } from "@/lib/api/usuario";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mi Perfil",
};

// Skeleton mientras se cargan los datos
function PerfilSkeleton() {
    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto pb-10 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-center p-4 relative mb-6">
                <div className="h-4 w-16 bg-stone-200 rounded absolute left-4" />
                <div className="h-4 w-24 bg-stone-200 rounded" />
            </div>
            {/* Avatar skeleton */}
            <div className="flex flex-col items-center px-4 mb-8 gap-3">
                <div className="w-28 h-28 bg-stone-200 rounded-full" />
                <div className="h-6 w-40 bg-stone-200 rounded" />
                <div className="h-4 w-28 bg-stone-200 rounded" />
                <div className="flex gap-2">
                    <div className="h-6 w-24 bg-stone-200 rounded-full" />
                    <div className="h-6 w-32 bg-stone-200 rounded-full" />
                </div>
            </div>
            {/* Stats skeleton */}
            <div className="flex gap-4 px-4 mb-6">
                <div className="flex-1 h-28 bg-stone-200 rounded-2xl" />
                <div className="flex-1 h-28 bg-stone-200 rounded-2xl" />
            </div>
            {/* Cards skeleton */}
            <div className="px-4 mb-6">
                <div className="h-40 bg-stone-200 rounded-2xl" />
            </div>
            <div className="px-4 mb-6">
                <div className="h-48 bg-stone-200 rounded-2xl" />
            </div>
            <div className="px-4 mb-8">
                <div className="h-40 bg-stone-200 rounded-2xl" />
            </div>
        </div>
    );
}

// Componente async separado para que Suspense lo pueda envolver
async function PerfilContent({ tipoUsuario }: { tipoUsuario: string | undefined }) {
    if (tipoUsuario === "distribuidor") {
        const distribuidor = await obtenerPerfilDistribuidor();
        if (distribuidor && distribuidor.id) {
            redirect(`/mercado/distribuidor/tienda?d=${distribuidor.id}`);
        } else {
            redirect("/mercado/distribuidor");
        }
    } else {
        const cliente = await obtenerInformacionPerfil();
        return <PerfilCliente cliente={cliente} />;
    }
}

export default async function PerfilPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token) {
        redirect("/login");
    }

    // Suspense hace que Next.js envíe el HTML del skeleton de inmediato (streaming)
    // y reemplaza con el perfil real cuando el fetch al backend termina.
    return (
        <Suspense fallback={<PerfilSkeleton />}>
            <PerfilContent tipoUsuario={tipoUsuario} />
        </Suspense>
    );
}
