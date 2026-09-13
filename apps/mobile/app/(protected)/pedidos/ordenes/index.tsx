import Ordenes from "@akindo/ui/screens/ordenes";
import { cancelarOrdenCompra, cargarOrdenes } from "@/utils/providers-data";

export default function OrdenesScreen() {
  // `ordenes` null: web las trae del servidor y acá las pide la pantalla.
  return (
    <Ordenes ordenes={null} cargarOrdenes={cargarOrdenes} cancelarAction={cancelarOrdenCompra} />
  );
}
