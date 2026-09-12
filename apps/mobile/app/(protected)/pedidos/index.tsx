import { Redirect } from "expo-router";
import Pedidos from "@akindo/ui/screens/pedidos";
import { useSesion } from "@/utils/session";
import { cargarPedidos } from "@/utils/providers-data";

export default function PedidosScreen() {
  const { tipo } = useSesion();

  // Igual que el `page.tsx` de web: los pedidos de un distribuidor viven en su
  // propia ruta (todavía sin migrar, así que ahí cae en "Unmatched Route").
  if (tipo === "distribuidor") return <Redirect href={"/distribuidor/pedidos" as never} />;

  // `datos` null: web los trae del servidor y acá los pide la pantalla.
  return <Pedidos datos={null} cargarDatos={cargarPedidos} />;
}
