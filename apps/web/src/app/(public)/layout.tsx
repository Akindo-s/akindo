import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function PublicLayout({
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
      <Header isLoggedIn={isLoggedIn} tipoUsuario={tipoUsuario} />
      <div className="flex flex-1">
        <Sidebar tipoUsuario={tipoUsuario} />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav tipoUsuario={tipoUsuario} />
    </>
  );
}
