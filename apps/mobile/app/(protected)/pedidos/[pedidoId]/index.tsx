import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import PedidoDetalle from "@akindo/ui/screens/pedido-detalle";
import DistribuidorPedidoDetalle from "@akindo/ui/screens/distribuidor-pedido-detalle";
import type { EstadoPedido } from "@akindo/shared/types/pedidos";
import { useSesion } from "@/utils/session";
import { actualizarEstadoPedido, cargarDetallePedido, valorarPedido } from "@/utils/providers-data";

export default function PedidoDetalleScreen() {
  // En web el id viene en `params` del page.tsx; acá, del nombre de la ruta.
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const { tipo } = useSesion();

  const cargar = useCallback(() => cargarDetallePedido(pedidoId), [pedidoId]);
  const valorar = useCallback(
    (puntuacion: number, comentario?: string) => valorarPedido(pedidoId, puntuacion, comentario),
    [pedidoId],
  );
  const actualizarEstado = useCallback(
    (estado: EstadoPedido, descripcion?: string) => actualizarEstadoPedido(pedidoId, estado, descripcion),
    [pedidoId],
  );

  // Igual que el `page.tsx` de web: la misma ruta, dos vistas según el tipo.
  // `pedido` null: web lo trae del servidor y acá lo pide la pantalla.
  if (tipo === "distribuidor") {
    return <DistribuidorPedidoDetalle pedido={null} cargarPedido={cargar} actualizarEstadoAction={actualizarEstado} />;
  }

  return <PedidoDetalle pedido={null} cargarPedido={cargar} valorarAction={valorar} />;
}
