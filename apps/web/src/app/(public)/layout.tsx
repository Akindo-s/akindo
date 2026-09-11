import { Header } from "@akindo/ui/components/layout/Header";
import { BottomNav } from "@akindo/ui/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { CarritoProvider } from "@akindo/shared/carrito-context";
import { estadoLayoutPublico } from "@akindo/shared/layoutsBehaviors/public";
import { cargarIdsCarrito } from "@/lib/providers-data";
import { sesionOpcional } from "@/lib/sesion";
import { _logout } from "@/lib/auth";

// Alto de pantalla fijo (lo da el body): Header arriba, BottomNav abajo y solo
// el <main> scrollea. Estilos replicados en apps/mobile/app/(public)/_layout.tsx.
export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoggedIn, tipoUsuario } = estadoLayoutPublico(await sesionOpcional());
  return (
    <CarritoProvider cargarIds={cargarIdsCarrito}>
      <Header isLoggedIn={isLoggedIn} tipoUsuario={tipoUsuario} onLogout={_logout} />
      <div className="flex flex-1 min-h-0">
        <Sidebar tipoUsuario={tipoUsuario} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Desde md navega el Sidebar. Se oculta con un <div> del DOM y no con
          una clase en el Nav: ahí `hidden` compite con el `display: flex` que
          react-native-web le pone a cada View, y gana según el orden de las
          hojas de estilo. */}
      <div className="md:hidden">
        <BottomNav tipoUsuario={tipoUsuario} />
      </div>
    </CarritoProvider>
  );
}
