import { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerMisPedidos, obtenerMisOrdenes, exportarPedidos, obtenerEntregas, obtenerEntregasPorDia, obtenerResumenPedidos } from "@/lib/api/pedidos";
import type { FiltrosPedidos } from "@akindo/shared/types/pedidos";
import { Suspense } from "react";
import Pedidos from "@akindo/ui/screens/pedidos";
import { sesionOpcional, sesionRequerida } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Mis Pedidos",
  description: "Gestiona y da seguimiento a tus pedidos en Akindo.",
};

async function PedidosContent() {
  // La primera página se pinta en el servidor; a partir de ahí los filtros y
  // la paginación los pide la pantalla con `cargarAction`.
  const [listado, ordenes] = await Promise.all([
    obtenerMisPedidos({ pagina: 1, cantidad: 10 }),
    obtenerMisOrdenes(),
  ]);

  async function cargarAction(filtros: FiltrosPedidos) {
    "use server";
    return obtenerMisPedidos(filtros);
  }

  async function exportarAction(formato: "xlsx" | "pdf" | "csv", filtros: FiltrosPedidos) {
    "use server";
    return exportarPedidos(formato, filtros);
  }

  async function entregasAction(pedidoIds: string[]) {
    "use server";
    return obtenerEntregas(pedidoIds);
  }

  async function resumenAction(filtros: FiltrosPedidos) {
    "use server";
    return obtenerResumenPedidos(filtros);
  }

  async function entregasPorDiaAction(hasta: string | null) {
    "use server";
    return obtenerEntregasPorDia(hasta);
  }

  return (
    <Pedidos
      listado={listado}
      cargarPedidos={cargarAction}
      exportarAction={exportarAction}
      cargarEntregas={entregasAction}
      cargarResumen={resumenAction}
      cargarEntregasPorDia={entregasPorDiaAction}
      // Solo para la insignia del acceso a órdenes: el listado de órdenes vive
      // en su propia pantalla.
      ordenesPendientes={ordenes.ordenes.filter((o) => o.estado === "pendiente").length}
    />
  );
}

function PedidosSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-6 animate-pulse space-y-4">
      <div className="h-7 w-40 bg-stone-200 rounded" />
      <div className="h-4 w-64 bg-stone-100 rounded" />
      <div className="flex gap-2 mt-4">
        <div className="h-9 w-24 bg-stone-200 rounded-full" />
        <div className="h-9 w-28 bg-stone-100 rounded-full" />
        <div className="h-9 w-24 bg-stone-100 rounded-full" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-44 bg-stone-100 rounded-2xl" />
      ))}
    </div>
  );
}

export default async function PedidosPage() {
  const { tipo } = await sesionOpcional();
  if (tipo === "distribuidor") redirect("/distribuidor/pedidos");
  await sesionRequerida("cliente");

  return (
    <Suspense fallback={<PedidosSkeleton />}>
      <PedidosContent />
    </Suspense>
  );
}
