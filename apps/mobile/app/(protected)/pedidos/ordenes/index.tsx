import Ordenes from "@akindo/ui/screens/ordenes";
import {
  cancelarOrdenCompra,
  cargarOrdenes,
  exportarOrdenesCliente,
  pagarOrdenCompra,
} from "@/utils/providers-data";

export default function OrdenesScreen() {
  // `listado` null: web lo trae del servidor y acá lo pide la pantalla.
  return (
    <Ordenes
      listado={null}
      cargarOrdenes={cargarOrdenes}
      cancelarAction={cancelarOrdenCompra}
      pagarAction={pagarOrdenCompra}
      exportarAction={exportarOrdenesCliente}
    />
  );
}
