import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerDetallePedido, crearValoracion, enviarActualizacionPedido } from "@/lib/api/pedidos";
import DetallePedidoView from "@/components/pedidos/DetallePedidoView";
import DetallePedidoDistView from "@/components/distribuidor/DetallePedidoDistView";
import { EstadoPedido } from "@/lib/types/pedidos";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { Boton } from "@/components/ui/Boton";

export const metadata: Metadata = { title: "Detalle del Pedido" };

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ pedidoId: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipo = cookieStore.get("tipo_usuario")?.value;
  if (!token || (tipo !== "cliente" && tipo !== "distribuidor")) redirect("/login");

  const { pedidoId } = await params;
  const pedido = await obtenerDetallePedido(pedidoId);
  if (!pedido) redirect("/pedidos");
  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <XCircle size={32} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-stone-900 mb-2">No pudimos encontrar el pedido</h1>
        <p className="text-sm text-stone-500 max-w-xs mb-6">
          Es posible que el enlace haya expirado o que no tengas permisos para ver este detalle.
        </p>
        <Link href="/pedidos">
          <Boton variante="secundario">Volver a mis pedidos</Boton>
        </Link>
      </div>
    );
  }

  async function valorarAction(puntuacion: number, comentario?: string) {
    "use server";
    return crearValoracion(pedidoId, puntuacion, comentario);
  }

  async function actualizarEstadoAction(estado: EstadoPedido, descripcion?: string) {
    "use server";
    return enviarActualizacionPedido(pedidoId, estado, descripcion);
  }

  if (tipo === "distribuidor") {
    return <DetallePedidoDistView pedido={pedido} actualizarEstadoAction={actualizarEstadoAction} />;
  }

  return <DetallePedidoView pedido={pedido} valorarAction={valorarAction} />;
}
