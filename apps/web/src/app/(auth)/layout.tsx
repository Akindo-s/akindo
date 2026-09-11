// estilos replicados en apps/mobile/app/(auth)/_layout.tsx ; si cambian aca, actualizar alla.
import "@/app/(auth)/registro/global.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="registro-fondo w-full min-h-screen p-4 py-8 flex items-center justify-center overflow-y-auto">
      {children}
    </main>
  );
}
