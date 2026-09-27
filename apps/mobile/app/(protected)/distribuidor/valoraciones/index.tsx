import DistribuidorValoraciones from "@akindo/ui/screens/distribuidor-valoraciones";
import { cargarValoracionesDistribuidor } from "@/utils/providers-data";

export default function ValoracionesDistribuidorScreen() {
  // `valoraciones` null: web las trae del servidor y acá las pide la pantalla.
  return <DistribuidorValoraciones valoraciones={null} cargarValoraciones={cargarValoracionesDistribuidor} />;
}
