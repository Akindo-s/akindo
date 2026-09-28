import DistribuidorOrdenes from "@akindo/ui/screens/distribuidor-ordenes";
import {
  aceptarOrdenCompra,
  cargarOrdenesDistribuidor,
  cargarResumenOrdenesDistribuidor,
  rechazarOrdenCompra,
} from "@/utils/providers-data";

export default function OrdenesDistribuidorScreen() {
  // `listado` null: web lo trae del servidor y acá lo pide la pantalla.
  return (
    <DistribuidorOrdenes
      listado={null}
      cargarOrdenes={cargarOrdenesDistribuidor}
      cargarResumen={cargarResumenOrdenesDistribuidor}
      aceptarAction={aceptarOrdenCompra}
      rechazarAction={rechazarOrdenCompra}
    />
  );
}
