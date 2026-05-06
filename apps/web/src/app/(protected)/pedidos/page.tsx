import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerMisPedidos, obtenerMisOrdenes } from "@/lib/api/pedidos";
import { Suspense } from "react";
import MisPedidosView from "@/components/pedidos/MisPedidosView";

export const metadata: Metadata = {
  title: "Mis Pedidos",
  description: "Gestiona y da seguimiento a tus pedidos en Akindo.",
};

async function PedidosContent() {
  const [pedidosActivos, pedidosPendientes, entregados, cancelados, ordenes] = await Promise.all([
    obtenerMisPedidos("en envio"),
    obtenerMisPedidos("pendiente de envio"),
    obtenerMisPedidos("entregado"),
    obtenerMisPedidos("cancelado"),
    obtenerMisOrdenes(),
  ]);

  return (
    <MisPedidosView
      activos={[...pedidosPendientes, ...pedidosActivos]}
      entregados={entregados}
      cancelados={cancelados}
      ordenes={ordenes}
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
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;
  if (tipo=='distribuidor') redirect('/distribuidor/pedidos')
  if (!token || tipo !== "cliente") redirect("/login");

  return (
    <Suspense fallback={<PedidosSkeleton />}>
      <PedidosContent />
    </Suspense>
  );
}
