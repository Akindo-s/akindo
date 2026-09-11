import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { CarritoProvider } from "@akindo/shared/carrito-context";
import { cargarIdsCarrito } from "@/lib/providers-data";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipoUsuario = cookieStore.get("tipo_usuario")?.value;
  const isLoggedIn = !!token;

  return (
    <>
    

        <CarritoProvider cargarIds={cargarIdsCarrito}>
      <Header isLoggedIn={isLoggedIn} tipoUsuario={tipoUsuario}/>
      {/* Solo el <main> scrollea (el body ya no). El BottomNav de este layout
          sigue siendo el viejo, `fixed`: por eso el pb-16. */}
      <div className="flex flex-1 min-h-0">
        <Sidebar tipoUsuario={tipoUsuario} />

        <main className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
        </CarritoProvider>
      <BottomNav tipoUsuario={tipoUsuario} />
    
    </>
  );
}
