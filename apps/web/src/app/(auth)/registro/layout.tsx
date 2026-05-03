import "@/app/(auth)/registro/global.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="registro-fondo w-full min-h-screen p-4 flex items-center justify-center overflow-y-auto">
      {children}
    </main>
  );
}
