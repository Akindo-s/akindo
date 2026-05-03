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
  const isLoggedIn = !!token;

  return (
    <>
      <Header isLoggedIn={isLoggedIn} />
      <div className="flex-1 pb-16">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
