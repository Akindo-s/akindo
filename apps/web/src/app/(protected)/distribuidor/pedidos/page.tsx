import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerPedidosDistribuidor, enviarActualizacionPedido } from "@/lib/api/pedidos";
import { EstadoPedido } from "@/lib/types/pedidos";
import { Suspense } from "react";
import PedidosDistribuidorView from "@/components/distribuidor/PedidosDistribuidorView";

export const metadata: Metadata = {
  title: "Gestión de Pedidos",
  description: "Gestiona el estado y envío de tus pedidos activos.",
};

async function PedidosContent() {
  const activos = await obtenerPedidosDistribuidor("pendiente de envio");
  const enEnvio = await obtenerPedidosDistribuidor("en envio");
  const entregados = await obtenerPedidosDistribuidor("entregado");
  const cancelados = await obtenerPedidosDistribuidor("cancelado");

  async function actualizarAction(pedidoId: string, estado: EstadoPedido, desc?: string) {
    "use server";
    return enviarActualizacionPedido(pedidoId, estado, desc);
  }

  return (
    <PedidosDistribuidorView
      activos={[...activos, ...enEnvio]}
      historial={[...entregados, ...cancelados]}
      actualizarAction={actualizarAction}
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
