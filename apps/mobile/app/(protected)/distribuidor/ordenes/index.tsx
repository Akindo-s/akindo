import DistribuidorOrdenes from "@akindo/ui/screens/distribuidor-ordenes";
import { aceptarOrdenCompra, cargarOrdenesDistribuidor, rechazarOrdenCompra } from "@/utils/providers-data";

export default function OrdenesDistribuidorScreen() {
  // `datos` null: web las trae del servidor y acá las pide la pantalla.
  return (
    <DistribuidorOrdenes
      datos={null}
      cargarDatos={cargarOrdenesDistribuidor}
      aceptarAction={aceptarOrdenCompra}
      rechazarAction={rechazarOrdenCompra}
    />
  );
}
