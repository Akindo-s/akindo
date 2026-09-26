import { Redirect, Stack } from "expo-router";
import { View } from "react-native";
import { useSesion } from "@/utils/session";

/**
 * Guardia de tipo para todo `distribuidor/*`.
 *
 * En web lo hace cada `page.tsx` con `sesionRequerida("distribuidor")`, que
 * redirige a `/login` si el tipo no coincide. En mobile no había equivalente: un
 * cliente que llegaba por deep link veía la pantalla y la API le respondía con
 * errores. Va en el layout del grupo para cubrir de una vez todas las rutas del
 * distribuidor (panel, inventario, crear/editar, órdenes, pedidos, valoraciones
 * y reportes).
 */
export default function DistribuidorLayout() {
  const { cargada, token, tipo } = useSesion();

  // AsyncStorage es asíncrono: sin esperar se redirige aunque haya sesión.
  if (!cargada) return <View className="flex-1 bg-white" />;
  if (!token || tipo !== "distribuidor") return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }} />;
}
