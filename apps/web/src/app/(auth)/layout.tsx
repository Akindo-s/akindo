// estilos replicados en apps/mobile/app/(auth)/_layout.tsx ; si cambian aca, actualizar alla.
import "@/app/(auth)/registro/global.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // El scroll vive en el <main> (el body ya no scrollea). Se centra con
    // `my-auto` y no con `justify-center`: con alto fijo y overflow, centrar
    // con justify-center corta la parte de arriba de un formulario alto.
    <main className="registro-fondo w-full flex-1 min-h-0 p-4 py-8 flex flex-col overflow-y-auto">
      <div className="my-auto w-full flex justify-center">
        {children}
      </div>
    </main>
  );
}
