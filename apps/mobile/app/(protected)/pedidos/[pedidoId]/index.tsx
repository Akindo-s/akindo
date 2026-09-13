import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import PedidoDetalle from "@akindo/ui/screens/pedido-detalle";
import { cargarDetallePedido, valorarPedido } from "@/utils/providers-data";

export default function PedidoDetalleScreen() {
  // En web el id viene en `params` del page.tsx; acá, del nombre de la ruta.
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();

  const cargar = useCallback(() => cargarDetallePedido(pedidoId), [pedidoId]);
  const valorar = useCallback(
    (puntuacion: number, comentario?: string) => valorarPedido(pedidoId, puntuacion, comentario),
    [pedidoId],
  );

  // `pedido` null: web lo trae del servidor y acá lo pide la pantalla.
  return <PedidoDetalle pedido={null} cargarPedido={cargar} valorarAction={valorar} />;
}
