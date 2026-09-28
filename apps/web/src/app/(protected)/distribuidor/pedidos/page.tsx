import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  enviarActualizacionPedido,
  exportarPedidosDistribuidor,
  obtenerEntregas,
  obtenerEntregasPorDia,
  obtenerOrdenesDistribuidor,
  obtenerPedidosDistribuidor,
  obtenerResumenPedidosDistribuidor,
} from "@/lib/api/pedidos";
import type { EstadoPedido, FiltrosPedidos } from "@akindo/shared/types/pedidos";
import { Suspense } from "react";
import PedidosDistribuidor from "@akindo/ui/screens/distribuidor-pedidos";

export const metadata: Metadata = {
  title: "Gestión de Pedidos",
  description: "Gestiona el estado y envío de tus pedidos activos.",
};

async function PedidosContent() {
  // La primera página se pinta en el servidor; a partir de ahí los filtros y
  // la paginación los pide la pantalla.
  const [listado, ordenes] = await Promise.all([
    obtenerPedidosDistribuidor({ pagina: 1, cantidad: 10 }),
    obtenerOrdenesDistribuidor({ estado: "pendiente", cantidad: 1 }),
  ]);

  async function cargarAction(filtros: FiltrosPedidos) {
    "use server";
    return obtenerPedidosDistribuidor(filtros);
  }

  async function resumenAction(filtros: FiltrosPedidos) {
    "use server";
    return obtenerResumenPedidosDistribuidor(filtros);
  }

  async function entregasAction(pedidoIds: string[]) {
    "use server";
    return obtenerEntregas(pedidoIds);
  }

  async function entregasPorDiaAction(hasta: string | null) {
    "use server";
    return obtenerEntregasPorDia(hasta);
  }

  async function exportarAction(formato: "xlsx" | "pdf" | "csv", filtros: FiltrosPedidos) {
    "use server";
    return exportarPedidosDistribuidor(formato, filtros);
  }

  async function actualizarAction(pedidoId: string, estado: EstadoPedido, desc?: string) {
    "use server";
    return enviarActualizacionPedido(pedidoId, estado, desc);
  }

  return (
    <PedidosDistribuidor
      listado={listado}
      cargarPedidos={cargarAction}
      cargarResumen={resumenAction}
      cargarEntregas={entregasAction}
      cargarEntregasPorDia={entregasPorDiaAction}
      exportarAction={exportarAction}
      actualizarAction={actualizarAction}
      ordenesPendientes={ordenes.total_ordenes}
    />
  );
}

function PedidosSkeleton() {
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

export default async function PedidosDistribuidorPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;

  if (!token || tipo !== "distribuidor") redirect("/login");

  return (
    <Suspense fallback={<PedidosSkeleton />}>
      <PedidosContent />
    </Suspense>
  );
}
