import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerDetallePedido, crearValoracion, enviarActualizacionPedido } from "@/lib/api/pedidos";
import PedidoDetalle from "@akindo/ui/screens/pedido-detalle";
import DistribuidorPedidoDetalle from "@akindo/ui/screens/distribuidor-pedido-detalle";
import { EstadoPedido } from "@akindo/shared/types/pedidos";

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

  async function valorarAction(puntuacion: number, comentario?: string) {
    "use server";
    return crearValoracion(pedidoId, puntuacion, comentario);
  }

  async function actualizarEstadoAction(estado: EstadoPedido, descripcion?: string) {
    "use server";
    return enviarActualizacionPedido(pedidoId, estado, descripcion);
  }

  if (tipo === "distribuidor") {
    return <DistribuidorPedidoDetalle pedido={pedido} actualizarEstadoAction={actualizarEstadoAction} />;
  }

  return <PedidoDetalle pedido={pedido} valorarAction={valorarAction} />;
}
