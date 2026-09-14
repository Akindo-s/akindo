import DistribuidorDashboard from "@akindo/ui/screens/distribuidor-dashboard";
import { archivarProductoDistribuidor, cargarDashboardDistribuidor } from "@/utils/providers-data";

export default function DistribuidorDashboardScreen() {
  // `datos` null: web los trae del servidor y acá los pide la pantalla.
  return (
    <DistribuidorDashboard
      datos={null}
      cargarDatos={cargarDashboardDistribuidor}
      archivarAction={archivarProductoDistribuidor}
    />
  );
}
