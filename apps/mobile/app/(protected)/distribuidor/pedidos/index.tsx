import PedidosDistribuidor from "@akindo/ui/screens/distribuidor-pedidos";
import { actualizarEstadoPedido, cargarPedidosDistribuidor } from "@/utils/providers-data";

export default function PedidosDistribuidorScreen() {
  // `datos` null: web los trae del servidor y acá los pide la pantalla.
  return (
    <PedidosDistribuidor
      datos={null}
      cargarDatos={cargarPedidosDistribuidor}
      actualizarAction={actualizarEstadoPedido}
    />
  );
}
