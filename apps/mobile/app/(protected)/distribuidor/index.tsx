import { useMemo } from "react";
import DistribuidorDashboard from "@akindo/ui/screens/distribuidor-dashboard";
import { archivarProductoDistribuidor, seccionesDashboardDistribuidor } from "@/utils/providers-data";

export default function DistribuidorDashboardScreen() {
  // `useMemo`: las promesas no pueden cambiar de identidad entre renders o los
  // `Suspense` de la pantalla volverían a suspender en cada uno. En web las crea
  // el Server Component.
  const secciones = useMemo(() => seccionesDashboardDistribuidor(), []);

  return <DistribuidorDashboard secciones={secciones} archivarAction={archivarProductoDistribuidor} />;
}
