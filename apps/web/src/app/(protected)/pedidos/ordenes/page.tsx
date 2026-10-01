import { Metadata } from "next";
import { Suspense } from "react";
import Ordenes from "@akindo/ui/screens/ordenes";
import type { FiltrosOrdenes } from "@akindo/shared/types/pedidos";
import { obtenerMisOrdenes, cancelarOrden, pagarOrden, exportarOrdenes } from "@/lib/api/pedidos";
import { sesionRequerida } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Mis Órdenes de Compra",
  description: "Administra tus órdenes de compra, su confirmación y su liquidación.",
};

async function OrdenesContent() {
  // La primera página se pinta en el servidor; a partir de ahí los filtros y
  // la paginación los pide la pantalla con `cargarAction`.
  const listado = await obtenerMisOrdenes({ pagina: 1, cantidad: 10 });

  async function cargarAction(filtros: FiltrosOrdenes) {
    "use server";
    return obtenerMisOrdenes(filtros);
  }

  async function cancelarAction(ordenId: string) {
    "use server";
    return cancelarOrden(ordenId);
  }

  async function pagarAction(ordenId: string) {
    "use server";
    return pagarOrden(ordenId);
  }

  async function exportarAction(formato: "xlsx" | "pdf" | "csv", filtros: FiltrosOrdenes) {
    "use server";
    return exportarOrdenes(formato, filtros);
  }

  return (
    <Ordenes
      listado={listado}
      cargarOrdenes={cargarAction}
      cancelarAction={cancelarAction}
      pagarAction={pagarAction}
      exportarAction={exportarAction}
    />
  );
}

function OrdenesSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 animate-pulse space-y-4">
      <div className="h-7 w-40 bg-stone-200 rounded" />
      <div className="h-4 w-64 bg-stone-100 rounded" />
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 w-56 bg-stone-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-96 bg-stone-100 rounded-2xl" />
    </div>
  );
}

export default async function OrdenesPage() {
  await sesionRequerida("cliente");

  return (
    <Suspense fallback={<OrdenesSkeleton />}>
      <OrdenesContent />
    </Suspense>
  );
}
