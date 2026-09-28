import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  aceptarOrden,
  obtenerOrdenesDistribuidor,
  obtenerResumenOrdenesDistribuidor,
  rechazarOrden,
} from "@/lib/api/pedidos";
import type { FiltrosOrdenes } from "@akindo/shared/types/pedidos";
import { Suspense } from "react";
import DistribuidorOrdenes from "@akindo/ui/screens/distribuidor-ordenes";

export const metadata: Metadata = {
  title: "Órdenes de Compra",
  description: "Gestiona las órdenes de compra entrantes.",
};

async function OrdenesContent() {
  // La bandeja abre en pendientes: es la pregunta con la que el vendedor
  // entra. La primera página se pinta en el servidor.
  const listado = await obtenerOrdenesDistribuidor({ estado: "pendiente", pagina: 1, cantidad: 10 });

  async function cargarAction(filtros: FiltrosOrdenes) {
    "use server";
    return obtenerOrdenesDistribuidor(filtros);
  }

  async function resumenAction(filtros: FiltrosOrdenes) {
    "use server";
    return obtenerResumenOrdenesDistribuidor(filtros);
  }

  async function aceptarAction(ordenId: string) {
    "use server";
    return aceptarOrden(ordenId);
  }

  async function rechazarAction(ordenId: string, motivo?: string) {
    "use server";
    return rechazarOrden(ordenId, motivo);
  }

  return (
    <DistribuidorOrdenes
      listado={listado}
      cargarOrdenes={cargarAction}
      cargarResumen={resumenAction}
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
