import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";
import DistribuidorDashboard from "@akindo/ui/screens/distribuidor-dashboard";
import { obtenerResumenMensual, obtenerPedidosActivos, obtenerProductosPocasExistencias } from "@/lib/api/distribuidor";
import { obtenerOrdenesDistribuidor } from "@/lib/api/pedidos";
import { archivarProducto } from "@/lib/api/productos";

export const metadata: Metadata = {
    title: "Panel de Distribuidor",
};

async function DashboardContent() {
    const [resumen, ordenesPendientes, pedidosActivos, alertas] = await Promise.all([
        obtenerResumenMensual(),
        obtenerOrdenesDistribuidor("pendiente"),
        obtenerPedidosActivos(),
        obtenerProductosPocasExistencias(),
    ]);

    async function archivarAction(productoId: string) {
        "use server";
        return archivarProducto(productoId);
    }

    return (
        <DistribuidorDashboard
            datos={{ resumen, ordenesPendientes, pedidosActivos, alertas }}
            archivarAction={archivarAction}
        />
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto pb-10 animate-pulse px-4 pt-6">
            <div className="h-6 w-48 bg-stone-200 rounded mb-2" />
            <div className="h-4 w-64 bg-stone-200 rounded mb-6" />
            <div className="h-32 bg-stone-200 rounded-2xl mb-3" />
            <div className="flex gap-3 mb-6">
                <div className="flex-1 h-28 bg-stone-200 rounded-2xl" />
                <div className="flex-1 h-28 bg-stone-200 rounded-2xl" />
            </div>
            <div className="flex gap-3 mb-8">
                <div className="h-10 w-36 bg-stone-200 rounded-full" />
                <div className="h-10 w-40 bg-stone-200 rounded-full" />
                <div className="h-10 w-28 bg-stone-200 rounded-full" />
            </div>
            <div className="h-6 w-48 bg-stone-200 rounded mb-4" />
            <div className="h-24 bg-stone-200 rounded-2xl mb-3" />
            <div className="h-24 bg-stone-200 rounded-2xl" />
        </div>
    );
}

export default async function DistribuidorPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const tipoUsuario = cookieStore.get("tipo_usuario")?.value;

    if (!token) redirect("/login");
    if (tipoUsuario !== "distribuidor") redirect("/");

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
