import { Redirect, Stack } from "expo-router";
import { View } from "react-native";
import { CarritoProvider } from "@akindo/shared/carrito-context";
import { estadoLayoutProtegido } from "@akindo/shared/layoutsBehaviors/protected";
import { Header } from "@akindo/ui/components/layout/Header";
import { BottomNav } from "@akindo/ui/components/layout/BottomNav";
import { AvisosProvider } from "@akindo/ui/components/ui/Avisos";
import { useSesion } from "@/utils/session";
import { _logout } from "@/utils/auth";
import { agregarAlCarrito, cargarIdsCarrito } from "@/utils/providers-data";

// Espejo de apps/web/src/app/(protected)/layout.tsx. Sin Sidebar: en web solo
// aparece desde md, y acá la navegación es el BottomNav.

export default function ProtectedLayout() {
  const sesion = useSesion();
  const { isLoggedIn, tipoUsuario, requiereLogin } = estadoLayoutProtegido(sesion);

  // AsyncStorage es asíncrono: sin esperar, se redirigía a /login aunque
  // hubiera sesión guardada (en web la cookie ya está leída antes de pintar).
  if (!sesion.cargada) return <View className="flex-1 bg-white" />;
  // Lo que en web hace el `redirect("/login")` de cada page.tsx protegida.
  if (requiereLogin) return <Redirect href="/login" />;

  return (
    <CarritoProvider cargarIds={cargarIdsCarrito} agregar={agregarAlCarrito}>
      {/* El View ocupa toda la pantalla: ahí se ubican los avisos (`absolute`). */}
      <View className="flex-1 bg-white">
        <AvisosProvider>
          <Header isLoggedIn={isLoggedIn} tipoUsuario={tipoUsuario} onLogout={_logout} />
          <View className="flex-1">
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }} />
          </View>
          {/* Sin `hrefsVisibles`, como el layout público: se ven las cuatro tabs. */}
          <BottomNav tipoUsuario={tipoUsuario} />
        </AvisosProvider>
      </View>
    </CarritoProvider>
  );
}
