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

/**
 * Tabs del BottomNav que ya existen como ruta en mobile. En el grupo público
 * salen de las Tabs de expo-router; acá el grupo es un Stack (el carrito no es
 * una tab: se entra desde el Header), así que va la lista. Agregar "/pedidos" y
 * "/perfil" cuando se migren.
 */
const HREFS_MIGRADOS = ["/", "/mercado"];

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
          <BottomNav tipoUsuario={tipoUsuario} hrefsVisibles={HREFS_MIGRADOS} />
        </AvisosProvider>
      </View>
    </CarritoProvider>
  );
}
