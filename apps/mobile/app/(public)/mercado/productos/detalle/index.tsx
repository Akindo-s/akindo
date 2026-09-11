import { useLocalSearchParams } from "expo-router";
import ProductoDetalle from "@akindo/ui/screens/producto-detalle";
import { verificarEnCarrito } from "@/utils/providers-data";

export default function ProductoDetalleScreen() {
  const { p } = useLocalSearchParams<{ p?: string }>();
  return <ProductoDetalle productoId={typeof p === "string" ? p : null} verificarEnCarrito={verificarEnCarrito} />;
}
