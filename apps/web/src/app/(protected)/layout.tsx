import { Header } from "@akindo/ui/components/layout/Header";
import { BottomNav } from "@akindo/ui/components/layout/BottomNav";
import { AvisosProvider } from "@akindo/ui/components/ui/Avisos";
import { Sidebar } from "@/components/layout/Sidebar";
import { CarritoProvider } from "@akindo/shared/carrito-context";
import { estadoLayoutProtegido } from "@akindo/shared/layoutsBehaviors/protected";
import { cargarIdsCarrito } from "@/lib/providers-data";
import { sesionOpcional } from "@/lib/sesion";
import { _logout } from "@/lib/auth";

// Mismo armado que el layout público: alto de pantalla fijo (lo da el body),
// Header arriba, BottomNav abajo y solo el <main> scrollea. Estilos replicados
// en apps/mobile/app/(protected)/_layout.tsx.
export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoggedIn, tipoUsuario } = estadoLayoutProtegido(await sesionOpcional());

  return (
    <CarritoProvider cargarIds={cargarIdsCarrito}>
      <AvisosProvider>
        <Header isLoggedIn={isLoggedIn} tipoUsuario={tipoUsuario} onLogout={_logout} />
        <div className="flex flex-1 min-h-0">
          <Sidebar tipoUsuario={tipoUsuario} />
          <main className="flex-1 min-w-0 overflow-y-auto">
            {children}
          </main>
        </div>
        {/* Desde md navega el Sidebar. Se oculta con un <div> del DOM y no con
            una clase en el Nav (regla 28). */}
        <div className="md:hidden">
          <BottomNav tipoUsuario={tipoUsuario} />
        </div>
      </AvisosProvider>
    </CarritoProvider>
  );
}
