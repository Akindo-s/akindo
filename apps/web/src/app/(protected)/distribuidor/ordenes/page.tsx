import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerOrdenesDistribuidor, aceptarOrden, rechazarOrden } from "@/lib/api/pedidos";
import { Suspense } from "react";
import OrdenesCompraView from "@/components/distribuidor/OrdenesCompraView";

export const metadata: Metadata = {
  title: "Órdenes de Compra",
  description: "Gestiona las órdenes de compra entrantes.",
};

async function OrdenesContent() {
  const pendientes = await obtenerOrdenesDistribuidor("pendiente");
  const aceptadas = await obtenerOrdenesDistribuidor("aceptada");
  const rechazadas = await obtenerOrdenesDistribuidor("rechazada");

  async function aceptarAction(ordenId: string) {
    "use server";
    return aceptarOrden(ordenId);
  }

  async function rechazarAction(ordenId: string, motivo?: string) {
    "use server";
    return rechazarOrden(ordenId, motivo);
  }

  return (
    <OrdenesCompraView
      pendientes={pendientes}
      aceptadas={aceptadas}
      rechazadas={rechazadas}
      aceptarAction={aceptarAction}
      rechazarAction={rechazarAction}
    />
  );
}

function OrdenesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 animate-pulse space-y-4">
      <div className="h-7 w-64 bg-stone-200 rounded" />
      <div className="flex gap-2 mt-4">
        <div className="h-10 w-32 bg-stone-200 rounded-full" />
        <div className="h-10 w-32 bg-stone-100 rounded-full" />
      </div>
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-stone-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function OrdenesDistribuidorPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;

  if (!token || tipo !== "distribuidor") redirect("/login");

  return (
    <Suspense fallback={<OrdenesSkeleton />}>
      <OrdenesContent />
    </Suspense>
  );
}
