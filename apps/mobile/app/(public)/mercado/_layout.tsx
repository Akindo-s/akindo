import { Stack } from "expo-router";

// Las subrutas de mercado se apilan dentro de la tab: así "volver" regresa a la
// pantalla anterior de mercado. `initialRouteName`: si se entra directo a una
// subruta (desde un chip del home), abajo queda el índice de mercado.
export const unstable_settings = { initialRouteName: "index" };

export default function MercadoLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }} />;
}
