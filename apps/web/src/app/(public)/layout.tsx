import { cookies } from "next/headers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const tipoUsuario = cookieStore.get("tipo_usuario")?.value;
  const isLoggedIn = !!token;
  console.log("TIPO USUARIO",tipoUsuario)

  return (
    <>
      <Header isLoggedIn={isLoggedIn} tipoUsuario={tipoUsuario} />
      <div className="flex-1 pb-16">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
