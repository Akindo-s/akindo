import { Tabs } from "expo-router";
import { View } from "react-native";
import { CarritoProvider } from "@akindo/shared/carrito-context";
import { estadoLayoutPublico } from "@akindo/shared/layoutsBehaviors/public";
import { Header } from "@akindo/ui/components/layout/Header";
import { BottomNav } from "@akindo/ui/components/layout/BottomNav";
import { AvisosProvider } from "@akindo/ui/components/ui/Avisos";
import { useSesion } from "@/utils/session";
import { _logout } from "@/utils/auth";
import { agregarAlCarrito, cargarIdsCarrito } from "@/utils/providers-data";

// Espejo de apps/web/src/app/(public)/layout.tsx: Header arriba, la pantalla y
// el BottomNav abajo, todo dentro del CarritoProvider y del AvisosProvider. Sin
// Sidebar: en web solo aparece desde md, y acá la navegación son las Tabs.

// "index" → "/", "mercado/index" → "/mercado": el href de cada tab registrada.
const hrefDeRuta = (nombre: string) => (nombre === "index" ? "/" : `/${nombre.replace(/\/index$/, "")}`);

export default function PublicLayout() {
  const sesion = useSesion();
  const { isLoggedIn, tipoUsuario } = estadoLayoutPublico(sesion);

  // Web lee la cookie antes de pintar. Acá AsyncStorage es asíncrono: sin
  // esperar, el Header parpadeaba en "Iniciar sesión" aunque hubiera sesión.
  if (!sesion.cargada) return <View className="flex-1 bg-white" />;

  return (
    // `agregar`: en web el default va a la route handler /api/carrito, que acá no existe.
    <CarritoProvider cargarIds={cargarIdsCarrito} agregar={agregarAlCarrito}>
      {/* El View ocupa toda la pantalla: ahí se ubican los avisos (`absolute`). */}
      <View className="flex-1 bg-white">
        <AvisosProvider>
          <Header isLoggedIn={isLoggedIn} tipoUsuario={tipoUsuario} onLogout={_logout} />
          <Tabs
            screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#FFFFFF" } }}
            // El BottomNav compartido hace de barra: solo muestra las tabs que
            // existen como ruta en este grupo.
            tabBar={({ state }) => (
              <BottomNav tipoUsuario={tipoUsuario}  />
            )}
          />
        </AvisosProvider>
      </View>
    </CarritoProvider>
  );
}
